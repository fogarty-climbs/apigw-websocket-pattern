import os
import zipfile
import subprocess
import shutil

# Resolve paths relative to this script's location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
LAYER_DIR = SCRIPT_DIR
LIBRARY_SRC = os.path.join(SCRIPT_DIR, 'shared')
PYTHON_TARGET = os.path.join(SCRIPT_DIR, 'python')
OUTPUT_ZIP = os.path.join(SCRIPT_DIR, 'layer.zip')
REQ_FILE = os.path.join(SCRIPT_DIR, 'requirements.txt')

# Clean temporary python/ folder if it exists
if os.path.exists(PYTHON_TARGET):
    shutil.rmtree(PYTHON_TARGET)
os.makedirs(PYTHON_TARGET, exist_ok=True)

try:
    # Step 1: Install requirements into python/ if requirements.txt exists
    if os.path.exists(REQ_FILE):
        print(f'Installing dependencies from {REQ_FILE}...')
        subprocess.check_call([
            'pip', 'install', '-v', '--upgrade', '-r', REQ_FILE, '--target', PYTHON_TARGET
        ])
    else:
        print('No requirements.txt found — skipping dependency install')

    # Step 2: Copy library/ into python/shared/
    LIBRARY_DST = os.path.join(PYTHON_TARGET, 'shared')
    if os.path.exists(LIBRARY_DST):
        shutil.rmtree(LIBRARY_DST)

    print(f'Copying library from {LIBRARY_SRC} to {LIBRARY_DST}...')
    shutil.copytree(LIBRARY_SRC, LIBRARY_DST)

    # Step 3: Zip python/ into layer.zip
    print(f'Creating zip at {OUTPUT_ZIP}...')
    with zipfile.ZipFile(OUTPUT_ZIP, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(PYTHON_TARGET):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, PYTHON_TARGET)
                zf.write(full_path, arcname=os.path.join('python', rel_path))

    print(f'✅ Layer zip created: {OUTPUT_ZIP}')

    print("Files being zipped:")
    for root, dirs, files in os.walk(PYTHON_TARGET):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, PYTHON_TARGET)
            arc_path = os.path.join("python", rel_path)
            print(f"  {arc_path}")

finally:
    # Step 4: Clean up temporary python/ folder
    if os.path.exists(PYTHON_TARGET):
        shutil.rmtree(PYTHON_TARGET)
        print(f'Cleaned up temporary folder: {PYTHON_TARGET}')