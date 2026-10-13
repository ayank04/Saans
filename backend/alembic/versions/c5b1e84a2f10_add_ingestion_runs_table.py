"""add_ingestion_runs_table

Revision ID: c5b1e84a2f10
Revises: 994909cf17e9
Create Date: 2026-10-13 22:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c5b1e84a2f10'
down_revision: Union[str, Sequence[str], None] = '994909cf17e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        'ingestion_runs',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('source', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('records_fetched', sa.Integer(), server_default='0', nullable=False),
        sa.Column('records_accepted', sa.Integer(), server_default='0', nullable=False),
        sa.Column('records_inserted', sa.Integer(), server_default='0', nullable=False),
        sa.Column('records_skipped_as_duplicates', sa.Integer(), server_default='0', nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('idx_ingestion_runs_source', 'ingestion_runs', ['source'], if_not_exists=True)
    op.create_index('idx_ingestion_runs_status', 'ingestion_runs', ['status'], if_not_exists=True)
    op.create_index('idx_ingestion_runs_started_at', 'ingestion_runs', ['started_at'], if_not_exists=True)

def downgrade() -> None:
    op.drop_index('idx_ingestion_runs_started_at', table_name='ingestion_runs')
    op.drop_index('idx_ingestion_runs_status', table_name='ingestion_runs')
    op.drop_index('idx_ingestion_runs_source', table_name='ingestion_runs')
    op.drop_table('ingestion_runs')
