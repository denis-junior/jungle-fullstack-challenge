import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TasksService } from './tasks.service';
import { Task, TaskStatus, TaskPriority } from './entities/task.entity';
import { Comment } from './entities/comment.entity';
import { TaskAssignment } from './entities/task-assignment.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: Repository<Task>;
  let commentRepository: Repository<Comment>;
  let assignmentRepository: Repository<TaskAssignment>;

  const mockTask = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    createdBy: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
    assignments: [],
    comments: [],
  };

  const mockRabbitClient = {
    connect: jest.fn().mockResolvedValue(undefined),
    emit: jest.fn(),
  };

  const mockAuthService = {
    connect: jest.fn().mockResolvedValue(undefined),
    send: jest.fn(),
  };

  const mockTaskRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockCommentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockAssignmentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(Comment),
          useValue: mockCommentRepository,
        },
        {
          provide: getRepositoryToken(TaskAssignment),
          useValue: mockAssignmentRepository,
        },
        {
          provide: 'RABBITMQ_CLIENT',
          useValue: mockRabbitClient,
        },
        {
          provide: 'AUTH_SERVICE',
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    commentRepository = module.get<Repository<Comment>>(
      getRepositoryToken(Comment),
    );
    assignmentRepository = module.get<Repository<TaskAssignment>>(
      getRepositoryToken(TaskAssignment),
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createTaskDto: CreateTaskDto = {
      title: 'New Task',
      description: 'New Description',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      assignedUserIds: ['user2', 'user3'],
    };

    it('should successfully create a task', async () => {
      mockTaskRepository.create.mockReturnValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(mockTask);
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockAssignmentRepository.create.mockReturnValue({});
      mockAssignmentRepository.save.mockResolvedValue([]);

      const result = await service.create(createTaskDto, 'user1');

      expect(result).toBeDefined();
      expect(mockTaskRepository.create).toHaveBeenCalled();
      expect(mockTaskRepository.save).toHaveBeenCalled();
      expect(mockRabbitClient.emit).toHaveBeenCalledWith(
        'task.created',
        expect.any(Object),
      );
    });
  });

  describe('findAll', () => {
    const queryDto = {
      page: 1,
      size: 10,
      status: undefined,
      priority: undefined,
      search: undefined,
    };

    it('should return paginated tasks', async () => {
      const tasks = [mockTask];
      mockTaskRepository.findAndCount.mockResolvedValue([tasks, 1]);

      const result = await service.findAll(queryDto);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data).toEqual(tasks);
      expect(result.meta.total).toBe(1);
      expect(mockTaskRepository.findAndCount).toHaveBeenCalled();
    });

    it('should filter tasks by status', async () => {
      const filteredQuery = { ...queryDto, status: TaskStatus.DONE };
      mockTaskRepository.findAndCount.mockResolvedValue([[mockTask], 1]);

      await service.findAll(filteredQuery);

      expect(mockTaskRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: TaskStatus.DONE }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne('1');

      expect(result).toEqual(mockTask);
      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['assignments', 'comments'],
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateTaskDto: UpdateTaskDto = {
      title: 'Updated Task',
      status: TaskStatus.DONE,
    };

    it('should successfully update a task', async () => {
      const updatedTask = { ...mockTask, ...updateTaskDto };
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(updatedTask);

      const result = await service.update('1', updateTaskDto, 'user1');

      expect(result).toBeDefined();
      expect(mockTaskRepository.save).toHaveBeenCalled();
      expect(mockRabbitClient.emit).toHaveBeenCalledWith(
        'task.updated',
        expect.any(Object),
      );
    });

    it('should throw NotFoundException if task not found', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('999', updateTaskDto, 'user1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should successfully delete a task', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockCommentRepository.delete.mockResolvedValue({ affected: 1 });
      mockAssignmentRepository.delete.mockResolvedValue({ affected: 1 });
      mockTaskRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove('1', 'user1');

      expect(result).toHaveProperty('message');
      expect(mockCommentRepository.delete).toHaveBeenCalledWith({
        taskId: '1',
      });
      expect(mockAssignmentRepository.delete).toHaveBeenCalledWith({
        taskId: '1',
      });
      expect(mockTaskRepository.delete).toHaveBeenCalledWith('1');
      expect(mockRabbitClient.emit).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if task not found', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999', 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not task creator', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);

      await expect(service.remove('1', 'otherUser')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('addComment', () => {
    const createCommentDto = {
      content: 'Test comment',
    };

    it('should successfully add a comment to a task', async () => {
      const comment = {
        id: '1',
        content: createCommentDto.content,
        taskId: '1',
        userId: 'user1',
        createdAt: new Date(),
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockCommentRepository.create.mockReturnValue(comment);
      mockCommentRepository.save.mockResolvedValue(comment);

      const result = await service.createComment(
        '1',
        createCommentDto,
        'user1',
      );

      expect(result).toEqual(comment);
      expect(mockCommentRepository.save).toHaveBeenCalled();
      expect(mockRabbitClient.emit).toHaveBeenCalledWith(
        'task.comment.created',
        expect.any(Object),
      );
    });

    it('should throw NotFoundException if task not found', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createComment('999', createCommentDto, 'user1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
