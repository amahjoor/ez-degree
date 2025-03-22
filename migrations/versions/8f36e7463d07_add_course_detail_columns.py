"""add course detail columns

Revision ID: 8f36e7463d07
Revises: 
Create Date: 2024-xx-xx
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision = '8f36e7463d07'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('courses', sa.Column('prerequisites', sa.Text()))
    op.add_column('courses', sa.Column('corequisites', sa.Text()))
    op.add_column('courses', sa.Column('restrictions', sa.Text()))
    op.add_column('courses', sa.Column('notes', sa.Text()))

def downgrade():
    op.drop_column('courses', 'prerequisites')
    op.drop_column('courses', 'corequisites')
    op.drop_column('courses', 'restrictions')
    op.drop_column('courses', 'notes')
