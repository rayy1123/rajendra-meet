import { NextResponse } from 'next/server';
import { getExpensesServer, saveExpenseServer, deleteExpenseServer } from '@/lib/data/expenses-server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('eventId') || undefined;
  const items = await getExpensesServer(eventId);
  return NextResponse.json({ success: true, items });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const saved = await saveExpenseServer(body);
    return NextResponse.json({ success: true, item: saved });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    await deleteExpenseServer(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
