import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiRequest } from '../utils/api'
import '../index.css'
import TaskWaveLogo from '../../assets/taskwave-logo.svg'
import TaskWaveMark from '../../assets/taskwave-mark.svg'

function TodoList() {
  const [tasks, setTasks] = useState([])
  const [taskInput, setTaskInput] = useState('')
  const [currentFilter, setCurrentFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [prioritySort, setPrioritySort] = useState('none')
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [priorityInput, setPriorityInput] = useState('low')
  const [editingPriority, setEditingPriority] = useState('low')
  const { user, logout } = useAuth()

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const response = await apiRequest('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error('Load tasks error:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTask = async () => {
    const taskText = taskInput.trim()
    
    if (taskText === '') {
      return
    }

    try {
      const response = await apiRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ text: taskText, priority: priorityInput })
      })

      if (response.ok) {
        const newTask = await response.json()
        setTasks(prev => [newTask, ...prev])
        setTaskInput('')
        setPriorityInput('low')
      }
    } catch (error) {
      console.error('Add task error:', error)
      alert('Failed to add task. Please try again.')
    }
  }

  const deleteTask = async (id) => {
    try {
      const response = await apiRequest(`/api/tasks/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== id.toString()))
      }
    } catch (error) {
      console.error('Delete task error:', error)
      alert('Failed to delete task. Please try again.')
    }
  }

  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id.toString())
    if (!task) return

    const newCompletedState = !task.completed

    try {
      const response = await apiRequest(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: newCompletedState })
      })

      if (response.ok) {
        const updatedTask = await response.json()
        setTasks(prev => prev.map(t => t.id === id.toString() ? updatedTask : t))
      }
    } catch (error) {
      console.error('Toggle task error:', error)
      alert('Failed to update task. Please try again.')
    }
  }

  const startEdit = (id, text, priority = 'low') => {
    setEditingId(id.toString())
    setEditingText(text)
    setEditingPriority(priority || 'low')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingText('')
  }

  const saveEdit = async (id) => {
    const text = editingText.trim()
    if (text === '') {
      alert('Task text cannot be empty')
      return
    }

    try {
      const response = await apiRequest(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ text, priority: editingPriority })
      })

      if (response.ok) {
        const updatedTask = await response.json()
        setTasks(prev => prev.map(t => t.id === id.toString() ? updatedTask : t))
        cancelEdit()
      }
    } catch (error) {
      console.error('Edit task error:', error)
      alert('Failed to update task. Please try again.')
    }
  }

  const clearCompleted = async () => {
    try {
      const response = await apiRequest('/api/tasks', {
        method: 'DELETE'
      })

      if (response.ok) {
        setTasks(prev => prev.filter(task => !task.completed))
      }
    } catch (error) {
      console.error('Clear completed error:', error)
      alert('Failed to clear completed tasks. Please try again.')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTask()
    }
  }

  let filteredTasks = tasks.filter(task => {
    if (currentFilter === 'active') return !task.completed
    if (currentFilter === 'completed') return task.completed
    return true
  })

  // apply priority filter
  if (priorityFilter !== 'all') {
    filteredTasks = filteredTasks.filter(task => (task.priority || 'low') === priorityFilter)
  }

  // apply priority sorting
  if (prioritySort !== 'none') {
    const order = { low: 1, medium: 2, high: 3 }
    filteredTasks = [...filteredTasks].sort((a, b) => {
      const pa = order[(a.priority || 'low')]
      const pb = order[(b.priority || 'low')]
      return prioritySort === 'asc' ? pa - pb : pb - pa
    })
  }

  const activeTasks = tasks.filter(task => !task.completed).length
  const hasCompleted = tasks.some(task => task.completed)

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="todo-app">
        <div className="header-section">
          <div className="brand">
            <img src={TaskWaveLogo} alt="TaskWave logo" className="brand-logo"/>
            <img src={TaskWaveMark} alt="TaskWave mark" className="brand-mark"/>
            <div>
              <div className="brand-title">TaskWave</div>
              <div className="brand-sub">📝 My To-Do List</div>
            </div>
          </div>
          
          <div className="user-info">
            <span>Welcome, {user?.username}!</span>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to log out?')) {
                  logout()
                }
              }}
              className="logout-btn"
            >
              Logout
            </button>
          </div>
        </div>
        
        <div className="input-section">
          <input
            type="text"
            id="taskInput"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a new task..."
            autoComplete="off"
          />
          <select value={priorityInput} onChange={(e) => setPriorityInput(e.target.value)} className="priority-select">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button onClick={addTask} className="add-btn">Add Task</button>
        </div>

        <div className="filter-section">
          <button
            className={`filter-btn ${currentFilter === 'all' ? 'active' : ''}`}
            onClick={() => setCurrentFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${currentFilter === 'active' ? 'active' : ''}`}
            onClick={() => setCurrentFilter('active')}
          >
            Active
          </button>
          <button
            className={`filter-btn ${currentFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setCurrentFilter('completed')}
          >
            Completed
          </button>
          <select
            className="priority-combined-select"
            value={`${priorityFilter}|${prioritySort}`}
            onChange={(e) => {
              const [f, s] = e.target.value.split('|')
              setPriorityFilter(f)
              setPrioritySort(s)
            }}
            title="Filter and sort by priority"
          >
            <option value="all|none">All priorities · No sort</option>
            <option value="all|asc">All · Low → High</option>
            <option value="all|desc">All · High → Low</option>
            <option value="low|none">Low only</option>
            <option value="medium|none">Medium only</option>
            <option value="high|none">High only</option>
          </select>
          
        </div>

        <div className="stats-section">
          <span id="taskCount">
            {activeTasks} {activeTasks === 1 ? 'task' : 'tasks'} remaining
          </span>
          {hasCompleted && (
            <button onClick={clearCompleted} className="clear-btn">
              Clear Completed
            </button>
          )}
        </div>

        <ul className="task-list">
          {filteredTasks.length === 0 ? (
            <li className="empty-state">
              {currentFilter === 'all'
                ? 'No tasks yet. Add one above!'
                : currentFilter === 'active'
                ? 'No active tasks!'
                : 'No completed tasks!'}
            </li>
          ) : (
            filteredTasks.map(task => (
              <li
                key={task.id}
                className={`task-item ${task.completed ? 'completed' : ''}`}
              >
                <input
                  type="checkbox"
                  className="task-checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                />
                {editingId === task.id.toString() ? (
                  <>
                    <input
                      className="task-edit-input"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(task.id)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      autoFocus
                    />
                    <select
                      value={editingPriority}
                      onChange={(e) => setEditingPriority(e.target.value)}
                      className="priority-select"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <button className="save-btn" onClick={() => saveEdit(task.id)}>Save</button>
                    <button className="cancel-btn" onClick={cancelEdit}>Cancel</button>
                  </>
                ) : (
                  <>
                    <>
                      <span className={`priority-badge ${task.priority || 'low'}`}>{(task.priority || 'low').toUpperCase()}</span>
                      <span
                        className="task-text"
                        title="Double-click to edit"
                        onDoubleClick={() => startEdit(task.id, task.text, task.priority)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') startEdit(task.id, task.text, task.priority) }}
                      >
                        {task.text}
                      </span>
                      <button className="edit-btn" onClick={() => startEdit(task.id, task.text, task.priority)}>Edit</button>
                    </>
                  </>
                )}
                <button
                  className="delete-btn"
                  onClick={() => deleteTask(task.id)}
                >
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

export default TodoList

