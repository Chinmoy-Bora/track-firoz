import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);
const dbName = 'gym-attendance';
const collectionName = 'attendance';

async function getCollection() {
  if (!client.topology?.isConnected()) await client.connect();
  return client.db(dbName).collection(collectionName);
}

export async function GET(req: NextRequest) {
  const collection = await getCollection();
  const doc = await collection.findOne({ _id: 'main' });
  return NextResponse.json(doc?.days || {});
}

export async function POST(req: NextRequest) {
  const { date } = await req.json();
  if (!date) return NextResponse.json({ error: 'Date required' }, { status: 400 });
  const collection = await getCollection();
  await collection.updateOne(
    { _id: 'main' },
    { $set: { [`days.${date}`]: true } },
    { upsert: true }
  );
  return NextResponse.json({ success: true });
}
