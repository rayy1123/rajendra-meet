import fs from 'fs';
import path from 'path';
import { Expense } from '@/types/database';
import { createClient } from '@/lib/supabase/server';

const STORE_PATH = path.join(process.cwd(), 'src', 'lib', 'data', 'expenses-store.json');

function readLocalExpenses(): Expense[] {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      return JSON.parse(raw) || [];
    }
  } catch (e) {
    console.error('Error reading local expenses store:', e);
  }
  return [];
}

function writeLocalExpenses(items: Expense[]): void {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(items, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing local expenses store:', e);
  }
}

export async function getExpensesServer(eventId?: string): Promise<Expense[]> {
  try {
    const supabase = await createClient();
    let query = supabase.from('expenses').select('*').order('expense_date', { ascending: false });
    if (eventId && eventId !== 'all') {
      query = query.eq('event_id', eventId);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data as Expense[];
    }
  } catch (e) {
    // Supabase query fallback to local
  }

  const local = readLocalExpenses();
  if (eventId && eventId !== 'all') {
    return local.filter((x) => x.event_id === eventId);
  }
  return local;
}

export async function saveExpenseServer(item: Omit<Expense, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<Expense> {
  const now = new Date().toISOString();
  const id = item.id || 'exp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const record: Expense = {
    id,
    event_id: item.event_id || null,
    type: item.type,
    amount: Number(item.amount) || 0,
    expense_date: item.expense_date || now.slice(0, 10),
    description: item.description || '',
    created_at: now,
    updated_at: now,
  };

  // 1. Try Supabase
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('expenses').upsert(record).select().single();
    if (!error && data) {
      // Also sync to local
      const list = readLocalExpenses().filter((x) => x.id !== id);
      list.unshift(data as Expense);
      writeLocalExpenses(list);
      return data as Expense;
    }
  } catch (e) {
    // Fallback to local
  }

  // 2. Fallback to local store
  const list = readLocalExpenses().filter((x) => x.id !== id);
  list.unshift(record);
  writeLocalExpenses(list);
  return record;
}

export async function deleteExpenseServer(id: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    await supabase.from('expenses').delete().eq('id', id);
  } catch {}

  const list = readLocalExpenses().filter((x) => x.id !== id);
  writeLocalExpenses(list);
  return true;
}
