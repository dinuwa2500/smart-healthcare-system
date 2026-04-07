/**
 * Simple test script to verify Email & RabbitMQ integration.
 * Run this to trigger a mock "Payment Succeeded" notification.
 */
const amqp = require('amqplib');

async function sendTestMessage() {
  // Use 'rabbitmq' hostname when running inside Docker
  const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
  
  try {
    console.log(`[test] Connecting to RabbitMQ at ${RABBIT_URL}...`);
    const conn = await amqp.connect(RABBIT_URL);
    const ch   = await conn.createChannel();
    
    const EXCHANGE = 'mediconnect';
    const RK       = 'payment.succeeded';

    const msg = {
      patientName: "Test Patient",
      patientEmail: "dinuwaperera123@gmail.com", // <-- CHANGE THIS!
      // doctorName: "Dr. Awesome",
      // doctorEmail: "dinuwaperera10@gmail.com",
      slotDate: new Date().toLocaleDateString(),
      slotTime: "10:30 AM",
      type: "video",
      amount: 2500,
      currency: "LKR"
    };

    console.log(`[test] Publishing mock message to [${EXCHANGE}] with key [${RK}]...`);
    
    ch.publish(EXCHANGE, RK, Buffer.from(JSON.stringify(msg)), {
      persistent: true,
      headers: { 'x-retry-count': 0 }
    });

    console.log(" [x] SUCCESS: Sent mock payment message.");
    console.log(" [!] Check the notification-service logs and your inbox!");
    
    // Close connection after a short delay
    setTimeout(() => {
      conn.close();
      process.exit(0);
    }, 1000);

  } catch (err) {
    console.error(" [!] Test failed:", err.message);
    process.exit(1);
  }
}

sendTestMessage();
