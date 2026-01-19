"""Add auth and security tables

Revision ID: add_auth_security
Revises: add_model_versions
Create Date: 2024-01-19

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'add_auth_security'
down_revision = 'add_model_versions'
branch_labels = None
depends_on = None


def upgrade():
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('password_hash', sa.String(), nullable=True),
        sa.Column('role', sa.String(), nullable=True),
        sa.Column('tenant_id', sa.String(), nullable=True),
        sa.Column('failed_login_attempts', sa.Integer(), nullable=True),
        sa.Column('locked_until', sa.DateTime(), nullable=True),
        sa.Column('email_verified', sa.Boolean(), nullable=True),
        sa.Column('verification_token', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_tenant_id'), 'users', ['tenant_id'], unique=False)

    # Create password_history table
    op.create_table('password_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('password_hash', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_password_history_id'), 'password_history', ['id'], unique=False)
    op.create_index(op.f('ix_password_history_user_id'), 'password_history', ['user_id'], unique=False)

    # Create login_attempts table
    op.create_table('login_attempts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('user_agent', sa.String(), nullable=True),
        sa.Column('success', sa.Boolean(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_login_attempts_email'), 'login_attempts', ['email'], unique=False)
    op.create_index(op.f('ix_login_attempts_id'), 'login_attempts', ['id'], unique=False)
    op.create_index(op.f('ix_login_attempts_timestamp'), 'login_attempts', ['timestamp'], unique=False)

    # Create security_audit_log table
    op.create_table('security_audit_log',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_type', sa.String(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('tenant_id', sa.String(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_security_audit_log_event_type'), 'security_audit_log', ['event_type'], unique=False)
    op.create_index(op.f('ix_security_audit_log_id'), 'security_audit_log', ['id'], unique=False)
    op.create_index(op.f('ix_security_audit_log_tenant_id'), 'security_audit_log', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_security_audit_log_timestamp'), 'security_audit_log', ['timestamp'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_security_audit_log_timestamp'), table_name='security_audit_log')
    op.drop_index(op.f('ix_security_audit_log_tenant_id'), table_name='security_audit_log')
    op.drop_index(op.f('ix_security_audit_log_id'), table_name='security_audit_log')
    op.drop_index(op.f('ix_security_audit_log_event_type'), table_name='security_audit_log')
    op.drop_table('security_audit_log')
    
    op.drop_index(op.f('ix_login_attempts_timestamp'), table_name='login_attempts')
    op.drop_index(op.f('ix_login_attempts_id'), table_name='login_attempts')
    op.drop_index(op.f('ix_login_attempts_email'), table_name='login_attempts')
    op.drop_table('login_attempts')
    
    op.drop_index(op.f('ix_password_history_user_id'), table_name='password_history')
    op.drop_index(op.f('ix_password_history_id'), table_name='password_history')
    op.drop_table('password_history')
    
    op.drop_index(op.f('ix_users_tenant_id'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
