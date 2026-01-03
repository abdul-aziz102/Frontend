import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const {
    tasks,
    stats,
    loading,
    error,
    pagination,
    filters,
    fetchTasks,
    fetchStats,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    updateFilters,
    setPage,
    clearError
  } = useTasks();

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: ''
  });

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [fetchTasks, fetchStats]);

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const handleInputChange = (e) => {
    setTaskForm({ ...taskForm, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleSearchChange = (e) => {
    updateFilters({ search: e.target.value });
  };

  const handleFilterChange = (key, value) => {
    updateFilters({ [key]: value });
  };

  const handleSortChange = (e) => {
    const [sortBy, sortOrder] = e.target.value.split(':');
    updateFilters({ sortBy, sortOrder });
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    if (!taskForm.title.trim()) {
      setFormError('Task title is required');
      setFormLoading(false);
      return;
    }

    const taskData = {
      title: taskForm.title.trim(),
      description: taskForm.description.trim(),
      priority: taskForm.priority,
      dueDate: taskForm.dueDate || undefined
    };

    let result;
    if (editingTask) {
      result = await updateTask(editingTask._id, taskData);
    } else {
      result = await createTask(taskData);
    }

    if (result.success) {
      resetForm();
      fetchTasks();
      fetchStats();
    } else {
      setFormError(result.error);
    }
    setFormLoading(false);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
    });
    setShowTaskForm(true);
  };

  const handleDeleteClick = (task) => {
    setShowDeleteModal(task);
  };

  const confirmDelete = async () => {
    if (!showDeleteModal) return;
    const result = await deleteTask(showDeleteModal._id);
    if (result.success) {
      setShowDeleteModal(null);
      fetchTasks();
      fetchStats();
    }
  };

  const resetForm = () => {
    setTaskForm({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: ''
    });
    setShowTaskForm(false);
    setEditingTask(null);
    setFormError('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Task Manager</h1>
        </div>
        <div className="header-right">
          <div className="user-info">
            <div className="user-avatar">{user ? getInitials(user.name) : 'U'}</div>
            <span className="user-name">{user?.name || 'User'}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        {(error || formError) && (
          <div className="error-message" style={{ marginBottom: '20px' }} onClick={clearError}>
            {error || formError}
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Tasks</h3>
            <div className="value">{stats.total}</div>
          </div>
          <div className="stat-card pending">
            <h3>Pending</h3>
            <div className="value">{stats.pending}</div>
          </div>
          <div className="stat-card completed">
            <h3>Completed</h3>
            <div className="value">{stats.completed}</div>
          </div>
        </div>

        {/* Add Task Form Toggle */}
        {!showTaskForm && (
          <button
            className="btn btn-primary"
            onClick={() => setShowTaskForm(true)}
            style={{ marginBottom: '24px' }}
          >
            + Add New Task
          </button>
        )}

        {/* Task Form */}
        {showTaskForm && (
          <div className="task-form">
            <h2>{editingTask ? 'Edit Task' : 'Add New Task'}</h2>
            <form onSubmit={handleSubmitTask}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={taskForm.title}
                  onChange={handleInputChange}
                  placeholder="What needs to be done?"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={taskForm.description}
                  onChange={handleInputChange}
                  placeholder="Add details (optional)"
                  rows="3"
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="form-row" style={{ marginBottom: '20px' }}>
                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    name="priority"
                    value={taskForm.priority}
                    onChange={handleInputChange}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="dueDate">Due Date</label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={taskForm.dueDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Saving...' : editingTask ? 'Update Task' : 'Add Task'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="filters-bar">
          <div className="search-input">
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={handleSearchChange}
            />
          </div>
          <div className="filter-group">
            <label>Status:</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Priority:</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Sort:</label>
            <select
              value={`${filters.sortBy}:${filters.sortOrder}`}
              onChange={handleSortChange}
            >
              <option value="createdAt:desc">Newest First</option>
              <option value="createdAt:asc">Oldest First</option>
              <option value="dueDate:asc">Due Date (Soonest)</option>
              <option value="dueDate:desc">Due Date (Latest)</option>
              <option value="priority:desc">Priority (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Tasks List */}
        <div className="tasks-section">
          <h2>
            Tasks ({pagination.totalTasks})
          </h2>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📋</div>
              <h3>No tasks found</h3>
              <p>
                {filters.search || filters.status !== 'all' || filters.priority !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first task to get started'}
              </p>
              {!showTaskForm && (
                <button className="btn btn-primary" onClick={() => setShowTaskForm(true)}>
                  + Add Your First Task
                </button>
              )}
            </div>
          ) : (
            <div className="task-list">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className={`task-card ${task.status}`}
                >
                  <div
                    className={`task-checkbox ${task.status === 'completed' ? 'checked' : ''}`}
                    onClick={() => toggleTaskStatus(task._id)}
                  >
                    {task.status === 'completed' && '✓'}
                  </div>
                  <div className="task-content">
                    <h3 className="task-title">{task.title}</h3>
                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}
                    <div className="task-meta">
                      <span className={`task-priority ${task.priority}`}>
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <span className={`task-due-date ${isOverdue(task.dueDate, task.status) ? 'overdue' : ''}`}>
                          Due: {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="task-actions">
                    <button
                      className="btn-icon"
                      onClick={() => handleEditTask(task)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon danger"
                      onClick={() => handleDeleteClick(task)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={page === pagination.currentPage ? 'active' : ''}
                  onClick={() => setPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setPage(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Task</h2>
              <button
                className="btn-icon"
                onClick={() => setShowDeleteModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this task?</p>
              <p style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                "{showDeleteModal.title}"
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
