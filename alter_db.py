import asyncio
import os
import sys

# Add current directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def alter_table():
    # Create connection
    engine = create_async_engine(str(settings.DATABASE_URL), echo=True)
    async with engine.begin() as conn:
        try:
            print("Adding visit_type...")
            await conn.execute(text("ALTER TABLE Appointments ADD visit_type VARCHAR(50) DEFAULT 'PathLab'"))
        except Exception as e:
            print(f"Skipped visit_type: {e}")
            
        try:
            print("Adding address...")
            await conn.execute(text("ALTER TABLE Appointments ADD address VARCHAR(500) NULL"))
        except Exception as e:
            print(f"Skipped address: {e}")
            
        try:
            print("Adding phone_number...")
            await conn.execute(text("ALTER TABLE Appointments ADD phone_number VARCHAR(20) NULL"))
        except Exception as e:
            print(f"Skipped phone_number: {e}")
            
    await engine.dispose()
    print("Done executing schema updates.")

if __name__ == "__main__":
    asyncio.run(alter_table())
