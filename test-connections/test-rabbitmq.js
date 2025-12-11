const amqp = require('amqplib');

async function testRabbitMQ() {
  try {
    // Conectar
    const connection = await amqp.connect('amqp://admin:admin@localhost:5672');
    console.log('✅ Conectado ao RabbitMQ!');

    // Criar canal
    const channel = await connection.createChannel();
    console.log('✅ Canal criado! ');

    // Criar fila
    const queue = 'test_queue_node';
    await channel.assertQueue(queue, { durable: true });
    console.log(`✅ Fila '${queue}' criada!`);

    // Enviar mensagem
    const msg = { test: 'Hello from Node.js!' };
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(msg)));
    console.log('✅ Mensagem enviada:', msg);

    // Fechar
    setTimeout(() => {
      connection.close();
      console.log('✅ Conexão fechada!');
      process.exit(0);
    }, 500);

  } catch (error) {
    console.error('❌ Erro:', error. message);
    process.exit(1);
  }
}

testRabbitMQ();