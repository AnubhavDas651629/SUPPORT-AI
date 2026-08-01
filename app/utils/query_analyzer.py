from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select
from sqlalchemy import text

async def analyze_query(session:AsyncSession, statement: Select) -> list[str]:
    """
    Excecutes EXPLAIN ANALYZE on a sqlalchemy select statement
    and returns PostgresSQL's excecution plan
    """
    compiled_stmt = str(statement.compile(compile_kwargs = {"literal_binds": True}))
    explain_query = f"Explain ANALYZE {compiled_stmt}"

    result = await session.execute(text(explain_query))
    plan_lines = [row[0] for row in result.fetchall()]

    print("\n -- EXPLAIN ANALYZE QUERY PLAN --")
    for line in plan_lines:
        print(line)
    print("--------------\n")
    return plan_lines