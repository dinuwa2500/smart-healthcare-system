'use strict';

const mongoose = require('mongoose');
require('dotenv').config();

const { getPatient } = require('./src/utils/patientClient');
const { getDoctor } = require('./src/utils/doctorClient');
const { getUser } = require('./src/utils/authClient');

async function runTest() {
  console.log('--- STARTING PAYMENT-SERVICE CLIENT TESTS ---');
  console.log(`AUTH_URL resolved to: ${process.env.AUTH_SERVICE_URL || 'http://auth-service:4000'}`);
  console.log(`PATIENT_URL resolved to: ${process.env.PATIENT_SERVICE_URL || 'http://patient-service:4001'}`);
  
  const patientAuthId = "69cb634d3cb72ec642464e95"; // from your logs
  
  console.log(`\n1. Testing authClient.getUser(${patientAuthId})...`);
  const authRes = await getUser(patientAuthId);
  console.log('Result:', JSON.stringify(authRes, null, 2));

  console.log(`\n2. Testing patientClient.getPatient(${patientAuthId})...`);
  const patientRes = await getPatient(patientAuthId);
  console.log('Result:', JSON.stringify(patientRes, null, 2));

  console.log('\n--- TEST COMPLETE ---');
  process.exit(0);
}

runTest();
