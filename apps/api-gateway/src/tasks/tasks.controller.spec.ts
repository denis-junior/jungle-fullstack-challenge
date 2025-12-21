/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { CreateTaskDto, TaskStatus, TaskPriority } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('TasksController', () => {
  let controller: TasksController;
  let tasksService: TasksService;

  const mockTask = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    createdBy: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRequest = {
    user: { id: 'user1' },
  };

  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createComment: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(() => undefined),
    error: jest.fn(() => undefined),
    warn: jest.fn(() => undefined),
    debug: jest.fn(() => undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
        {
          provide: WINSTON_MODULE_PROVIDER as string,
          useValue: mockLogger,
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TasksController>(TasksController);
    tasksService = module.get<TasksService>(TasksService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createTaskDto: CreateTaskDto = {
      title: 'New Task',
      description: 'New Description',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      assignedUserIds: ['user2'],
    };

    it('should successfully create a task', async () => {
      mockTasksService.create.mockResolvedValue(mockTask);

      const result = await controller.create(createTaskDto, mockRequest);

      expect(result).toEqual(mockTask);
      expect(tasksService.create).toHaveBeenCalledWith(
        createTaskDto,
        mockRequest.user.id,
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating task',
        expect.objectContaining({ title: createTaskDto.title }),
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Task created successfully',
        expect.any(Object),
      );
    });
  });

  describe('findAll', () => {
    const queryDto: QueryTasksDto = {
      page: 1,
      size: 10,
    };

    it('should return paginated tasks', async () => {
      const paginatedResponse = {
        data: [mockTask],
        meta: {
          page: 1,
          size: 10,
          total: 1,
          totalPages: 1,
        },
      };
      mockTasksService.findAll.mockResolvedValue(paginatedResponse);

      const result = await controller.findAll(queryDto);

      expect(result).toEqual(paginatedResponse);
      expect(tasksService.findAll).toHaveBeenCalledWith(queryDto);
    });
  });

  describe('findOne', () => {
    it('should return a single task', async () => {
      mockTasksService.findOne.mockResolvedValue(mockTask);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockTask);
      expect(tasksService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    const updateTaskDto: UpdateTaskDto = {
      title: 'Updated Task',
      status: 'completed',
    };

    it('should successfully update a task', async () => {
      const updatedTask = { ...mockTask, ...updateTaskDto };
      mockTasksService.update.mockResolvedValue(updatedTask);

      const result = await controller.update('1', updateTaskDto, mockRequest);

      expect(result).toEqual(updatedTask);
      expect(tasksService.update).toHaveBeenCalledWith(
        '1',
        updateTaskDto,
        mockRequest.user.id,
      );
    });
  });

  describe('remove', () => {
    it('should successfully delete a task', async () => {
      mockTasksService.remove.mockResolvedValue(undefined);

      await controller.remove('1', mockRequest);

      expect(tasksService.remove).toHaveBeenCalledWith(
        '1',
        mockRequest.user.id,
      );
    });
  });

  describe('createComment', () => {
    const createCommentDto: CreateCommentDto = {
      content: 'Test comment',
    };

    it('should successfully add a comment to a task', async () => {
      const comment = {
        id: '1',
        content: createCommentDto.content,
        taskId: '1',
        userId: mockRequest.user.id,
        createdAt: new Date(),
      };
      mockTasksService.createComment.mockResolvedValue(comment);

      const result = await controller.createComment(
        '1',
        createCommentDto,
        mockRequest,
      );

      expect(result).toEqual(comment);
      expect(tasksService.createComment).toHaveBeenCalledWith(
        '1',
        createCommentDto,
        mockRequest.user.id,
      );
    });
  });
});
