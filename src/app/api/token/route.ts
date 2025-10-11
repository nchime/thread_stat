import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  const { token } = await request.json();

  if (!token) {
    return NextResponse.json({ error: 'Token is required.' }, { status: 400 });
  }

  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    let envFileContent = '';
    try {
      envFileContent = await fs.readFile(envPath, 'utf-8');
    } catch {
      // .env.local does not exist, will create it
    }

    const lines = envFileContent.split('\n');
    let tokenExists = false;
    const newLines = lines.map(line => {
      if (line.startsWith('THREADS_ACCESS_TOKEN=')) {
        tokenExists = true;
        return `THREADS_ACCESS_TOKEN=${token}`;
      }
      return line;
    });

    if (!tokenExists) {
      newLines.push(`THREADS_ACCESS_TOKEN=${token}`);
    }

    await fs.writeFile(envPath, newLines.join('\n'));

    return NextResponse.json({ message: 'Token updated successfully.' });
  } catch (error) {
    console.error('Failed to update token:', error);
    return NextResponse.json({ error: 'Failed to update token.' }, { status: 500 });
  }
}
