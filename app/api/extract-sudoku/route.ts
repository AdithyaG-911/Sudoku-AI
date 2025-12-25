
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
    let tempFilePath = '';

    try {
        const formData = await request.formData();
        const file = formData.get('image') as File;

        if (!file) {
            return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const tempDir = os.tmpdir();
        const fileName = `sudoku-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        tempFilePath = join(tempDir, fileName);

        await writeFile(tempFilePath, buffer);

        // Execute Python script
        // In local Windows: py -3.10
        // In production (Railway/Render/Linux): python3 or python3.10
        const scriptPath = join(process.cwd(), 'scripts', 'extract_sudoku.py');
        const pythonCommand = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'py -3.10' : 'python3');
        const command = `${pythonCommand} "${scriptPath}" "${tempFilePath}"`;

        console.log(`Executing command: ${command}`);

        const { stdout, stderr } = await execAsync(command);

        if (stderr) {
            console.warn('Python stderr:', stderr);
        }

        let result;
        try {
            result = JSON.parse(stdout);
        } catch (e) {
            console.error('Failed to parse Python output:', stdout);
            return NextResponse.json({
                error: 'Invalid response from extractor',
                details: String(e),
                stdout: stdout,
                stderr: stderr
            }, { status: 500 });
        }

        if (result.error) {
            return NextResponse.json({
                error: result.error,
                stderr: stderr,
                stdout: stdout
            }, { status: 500 });
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: String(error),
            stdout: error?.stdout || '',
            stderr: error?.stderr || ''
        }, { status: 500 });
    } finally {
        // Cleanup temp file
        if (tempFilePath) {
            try {
                await unlink(tempFilePath);
            } catch (e) {
                console.error('Failed to delete temp file:', e);
            }
        }
    }
}
