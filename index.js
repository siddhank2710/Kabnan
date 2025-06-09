/**
 * Team Kanban Board Application
 * Optimized for daily task management with Bootstrap 5.3
 */

class TeamKanbanBoard {
    constructor() {
        this.data = {
            columns: [
                {
                    id: "todo",
                    title: "To Do",
                    icon: "clipboard-list",
                    theme: "primary",
                    items: []
                },
                {
                    id: "completed", 
                    title: "Completed",
                    icon: "check-circle",
                    theme: "success", 
                    items: []
                },
                {
                    id: "resources",
                    title: "Resources", 
                    icon: "folder",
                    theme: "info",
                    items: []
                }
            ],
            settings: {
                title: "Team Kanban Board",
                subtitle: "Daily Task Management", 
                enableTimestamps: true,
                enablePriority: true,
                autoSave: true
            }
        };
        
        this.currentColumn = null;
        this.currentEditTask = null;
        this.itemIdCounter = 1;
        this.draggedTaskId = null;
        this.draggedSourceColumn = null;
        
        // Bootstrap modal instances
        this.taskModal = null;
        this.editTaskModal = null;
        
        this.init();
    }
    
    /**
     * Initialize the application
     */
    init() {
        this.loadFromStorage();
        this.initializeModals();
        this.renderBoard();
        this.setupEventListeners();
        this.updateCounters();
        
        // Auto-save every 30 seconds
        if (this.data.settings.autoSave) {
            setInterval(() => this.saveToStorage(), 30000);
        }
        
        console.log('Team Kanban Board initialized successfully');
    }
    
    /**
     * Initialize Bootstrap modals
     */
    initializeModals() {
        this.taskModal = new bootstrap.Modal(document.getElementById('taskModal'));
        this.editTaskModal = new bootstrap.Modal(document.getElementById('editTaskModal'));
    }
    
    /**
     * Load data from localStorage
     */
    loadFromStorage() {
        try {
            const savedData = localStorage.getItem('teamKanbanData');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                this.data = { ...this.data, ...parsed };
                
                // Update item counter to avoid ID conflicts
                let maxId = 0;
                this.data.columns.forEach(column => {
                    column.items.forEach(item => {
                        const id = parseInt(item.id.replace('task-', ''));
                        if (id > maxId) maxId = id;
                    });
                });
                this.itemIdCounter = maxId + 1;
            }
        } catch (error) {
            console.error('Error loading data from storage:', error);
            this.showToast('Error loading saved data', 'error');
        }
    }
    
    /**
     * Save data to localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem('teamKanbanData', JSON.stringify(this.data));
        } catch (error) {
            console.error('Error saving data to storage:', error);
            this.showToast('Error saving data', 'error');
        }
    }
    
    /**
     * Render the entire board
     */
    renderBoard() {
        this.data.columns.forEach(column => {
            this.renderColumn(column);
        });
        this.updateCounters();
    }
    
    /**
     * Render a specific column
     */
    renderColumn(column) {
        const columnElement = document.getElementById(`${column.id}-column`);
        if (!columnElement) return;
        
        // Clear existing content except empty state
        const existingTasks = columnElement.querySelectorAll('.task-card');
        existingTasks.forEach(task => task.remove());
        
        // Render tasks
        column.items.forEach(item => {
            const taskElement = this.createTaskElement(item, column.id);
            columnElement.appendChild(taskElement);
        });
        
        // Show/hide empty state
        const emptyState = columnElement.querySelector('.empty-state');
        if (emptyState) {
            emptyState.style.display = column.items.length > 0 ? 'none' : 'block';
        }
    }
    
    /**
     * Create a task element
     */
    createTaskElement(task, columnId) {
        const taskDiv = document.createElement('div');
        taskDiv.className = `task-card priority-${task.priority || 'medium'}`;
        taskDiv.draggable = true;
        taskDiv.dataset.taskId = task.id;
        taskDiv.dataset.column = columnId;
        
        const priorityBadgeClass = this.getPriorityBadgeClass(task.priority);
        const timestamp = this.data.settings.enableTimestamps && task.createdAt 
            ? this.formatTimestamp(task.createdAt) 
            : '';
        
        // Create move buttons based on current column
        const moveButtons = this.createMoveButtons(columnId);
        
        taskDiv.innerHTML = `
            <div class="task-actions">
                ${moveButtons}
                <button class="btn btn-outline-primary btn-sm edit-task-btn" data-task-id="${task.id}" title="Edit task">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-outline-danger btn-sm delete-task-btn" data-task-id="${task.id}" title="Delete task">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
            
            <div class="task-title">${this.escapeHtml(task.title)}</div>
            
            ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
            
            <div class="task-meta">
                <span class="priority-badge badge ${priorityBadgeClass}">
                    ${task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium'} Priority
                </span>
                ${timestamp ? `<div class="task-timestamp">${timestamp}</div>` : ''}
            </div>
        `;
        
        // Add event listeners
        this.addTaskEventListeners(taskDiv);
        
        return taskDiv;
    }
    
    /**
     * Create move buttons for task based on current column
     */
    createMoveButtons(currentColumn) {
        let buttons = '';
        
        if (currentColumn === 'todo') {
            buttons += `<button class="btn btn-outline-success btn-sm move-task-btn" data-target="completed" title="Move to Completed"><i class="bi bi-check"></i></button>`;
            buttons += `<button class="btn btn-outline-info btn-sm move-task-btn" data-target="resources" title="Move to Resources"><i class="bi bi-folder"></i></button>`;
        } else if (currentColumn === 'completed') {
            buttons += `<button class="btn btn-outline-primary btn-sm move-task-btn" data-target="todo" title="Move to To Do"><i class="bi bi-arrow-left"></i></button>`;
            buttons += `<button class="btn btn-outline-info btn-sm move-task-btn" data-target="resources" title="Move to Resources"><i class="bi bi-folder"></i></button>`;
        } else if (currentColumn === 'resources') {
            buttons += `<button class="btn btn-outline-primary btn-sm move-task-btn" data-target="todo" title="Move to To Do"><i class="bi bi-clipboard"></i></button>`;
            buttons += `<button class="btn btn-outline-success btn-sm move-task-btn" data-target="completed" title="Move to Completed"><i class="bi bi-check"></i></button>`;
        }
        
        return buttons;
    }
    
    /**
     * Add event listeners to a task element
     */
    addTaskEventListeners(taskElement) {
        // Drag events
        taskElement.addEventListener('dragstart', (e) => {
            this.draggedTaskId = taskElement.dataset.taskId;
            this.draggedSourceColumn = taskElement.dataset.column;
            
            taskElement.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', this.draggedTaskId);
            
            console.log('Drag started:', this.draggedTaskId, 'from', this.draggedSourceColumn);
        });
        
        taskElement.addEventListener('dragend', (e) => {
            taskElement.classList.remove('dragging');
            
            // Remove all drag-over classes
            document.querySelectorAll('.column-content').forEach(col => {
                col.classList.remove('drag-over', 'drag-over-success', 'drag-over-info');
            });
        });
        
        // Move buttons
        const moveButtons = taskElement.querySelectorAll('.move-task-btn');
        moveButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const targetColumn = btn.dataset.target;
                const taskId = taskElement.dataset.taskId;
                const sourceColumn = taskElement.dataset.column;
                this.moveTask(taskId, sourceColumn, targetColumn);
            });
        });
        
        // Button events
        const editBtn = taskElement.querySelector('.edit-task-btn');
        const deleteBtn = taskElement.querySelector('.delete-task-btn');
        
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.editTask(e.target.closest('[data-task-id]').dataset.taskId);
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.deleteTask(e.target.closest('[data-task-id]').dataset.taskId);
            });
        }
        
        // Task click for editing (only if not clicking on buttons)
        taskElement.addEventListener('click', (e) => {
            if (!e.target.closest('.task-actions')) {
                this.editTask(taskElement.dataset.taskId);
            }
        });
        
        // Keyboard accessibility
        taskElement.setAttribute('tabindex', '0');
        taskElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.editTask(taskElement.dataset.taskId);
            } else if (e.key === 'Delete') {
                e.preventDefault();
                this.deleteTask(taskElement.dataset.taskId);
            }
        });
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add task buttons
        document.querySelectorAll('.add-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentColumn = e.target.dataset.column;
                this.showAddTaskModal();
            });
        });
        
        // Form submissions
        document.getElementById('taskForm').addEventListener('submit', this.handleAddTask.bind(this));
        document.getElementById('editTaskForm').addEventListener('submit', this.handleEditTask.bind(this));
        
        // Setup drop zones for each column
        this.data.columns.forEach(column => {
            const columnElement = document.getElementById(`${column.id}-column`);
            if (columnElement) {
                this.setupDropZone(columnElement, column.id);
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.taskModal.hide();
                this.editTaskModal.hide();
            }
        });
        
        // Window beforeunload for auto-save
        window.addEventListener('beforeunload', () => {
            if (this.data.settings.autoSave) {
                this.saveToStorage();
            }
        });
    }
    
    /**
     * Setup drop zone for a column
     */
    setupDropZone(columnElement, columnId) {
        columnElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        
        columnElement.addEventListener('dragenter', (e) => {
            e.preventDefault();
            if (this.draggedTaskId && this.draggedSourceColumn !== columnId) {
                columnElement.classList.add('drag-over');
                if (columnId === 'completed') {
                    columnElement.classList.add('drag-over-success');
                } else if (columnId === 'resources') {
                    columnElement.classList.add('drag-over-info');
                }
            }
        });
        
        columnElement.addEventListener('dragleave', (e) => {
            // Only remove drag styles if we're actually leaving the column
            if (!columnElement.contains(e.relatedTarget)) {
                columnElement.classList.remove('drag-over', 'drag-over-success', 'drag-over-info');
            }
        });
        
        columnElement.addEventListener('drop', (e) => {
            e.preventDefault();
            
            const targetColumnId = columnId;
            
            console.log('Drop detected on column:', targetColumnId);
            console.log('Dragged task:', this.draggedTaskId, 'from:', this.draggedSourceColumn);
            
            if (this.draggedTaskId && this.draggedSourceColumn && this.draggedSourceColumn !== targetColumnId) {
                this.moveTask(this.draggedTaskId, this.draggedSourceColumn, targetColumnId);
            }
            
            // Clean up drag styles
            columnElement.classList.remove('drag-over', 'drag-over-success', 'drag-over-info');
            
            // Reset drag state
            this.draggedTaskId = null;
            this.draggedSourceColumn = null;
        });
    }
    
    /**
     * Show add task modal
     */
    showAddTaskModal() {
        document.getElementById('taskForm').reset();
        document.getElementById('taskModalLabel').innerHTML = `
            <i class="bi bi-plus-circle me-2"></i>
            Add New ${this.currentColumn === 'resources' ? 'Resource' : 'Task'}
        `;
        this.taskModal.show();
        
        // Focus on title input
        setTimeout(() => {
            document.getElementById('taskTitle').focus();
        }, 150);
    }
    
    /**
     * Handle add task form submission
     */
    handleAddTask(e) {
        e.preventDefault();
        
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const priority = document.getElementById('taskPriority').value;
        
        if (!title) {
            this.showToast('Task title is required', 'error');
            return;
        }
        
        const newTask = {
            id: `task-${this.itemIdCounter++}`,
            title,
            description,
            priority,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const column = this.data.columns.find(col => col.id === this.currentColumn);
        if (column) {
            column.items.push(newTask);
            this.renderColumn(column);
            this.updateCounters();
            this.saveToStorage();
            
            this.taskModal.hide();
            this.showToast(`${this.currentColumn === 'resources' ? 'Resource' : 'Task'} added successfully`, 'success');
            
            // Add animation class
            setTimeout(() => {
                const newElement = document.querySelector(`[data-task-id="${newTask.id}"]`);
                if (newElement) {
                    newElement.classList.add('new-task');
                }
            }, 100);
        }
    }
    
    /**
     * Edit task
     */
    editTask(taskId) {
        const task = this.findTask(taskId);
        if (!task) return;
        
        this.currentEditTask = task;
        
        document.getElementById('editTaskTitle').value = task.title;
        document.getElementById('editTaskDescription').value = task.description || '';
        document.getElementById('editTaskPriority').value = task.priority || 'medium';
        
        this.editTaskModal.show();
    }
    
    /**
     * Handle edit task form submission
     */
    handleEditTask(e) {
        e.preventDefault();
        
        if (!this.currentEditTask) return;
        
        const title = document.getElementById('editTaskTitle').value.trim();
        const description = document.getElementById('editTaskDescription').value.trim();
        const priority = document.getElementById('editTaskPriority').value;
        
        if (!title) {
            this.showToast('Task title is required', 'error');
            return;
        }
        
        this.currentEditTask.title = title;
        this.currentEditTask.description = description;
        this.currentEditTask.priority = priority;
        this.currentEditTask.updatedAt = new Date().toISOString();
        
        this.renderBoard();
        this.saveToStorage();
        this.editTaskModal.hide();
        this.showToast('Task updated successfully', 'success');
        
        this.currentEditTask = null;
    }
    
    /**
     * Delete task with confirmation
     */
    deleteTask(taskId) {
        const task = this.findTask(taskId);
        if (!task) return;
        
        if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
            this.data.columns.forEach(column => {
                const index = column.items.findIndex(item => item.id === taskId);
                if (index !== -1) {
                    column.items.splice(index, 1);
                    this.renderColumn(column);
                }
            });
            
            this.updateCounters();
            this.saveToStorage();
            this.showToast('Task deleted successfully', 'success');
        }
    }
    
    /**
     * Move task between columns
     */
    moveTask(taskId, sourceColumnId, targetColumnId) {
        console.log('Moving task:', taskId, 'from', sourceColumnId, 'to', targetColumnId);
        
        const sourceColumn = this.data.columns.find(col => col.id === sourceColumnId);
        const targetColumn = this.data.columns.find(col => col.id === targetColumnId);
        
        if (!sourceColumn || !targetColumn) {
            console.error('Source or target column not found');
            return;
        }
        
        const taskIndex = sourceColumn.items.findIndex(item => item.id === taskId);
        if (taskIndex === -1) {
            console.error('Task not found in source column');
            return;
        }
        
        const task = sourceColumn.items.splice(taskIndex, 1)[0];
        task.updatedAt = new Date().toISOString();
        targetColumn.items.push(task);
        
        this.renderBoard();
        this.saveToStorage();
        this.showToast(`Task moved to ${targetColumn.title}`, 'success');
        
        console.log('Task moved successfully');
    }
    
    /**
     * Update task counters
     */
    updateCounters() {
        const todoCount = this.data.columns.find(col => col.id === 'todo').items.length;
        const completedCount = this.data.columns.find(col => col.id === 'completed').items.length;
        const resourcesCount = this.data.columns.find(col => col.id === 'resources').items.length;
        const totalCount = todoCount + completedCount + resourcesCount;
        
        document.getElementById('todo-count').textContent = todoCount;
        document.getElementById('completed-count').textContent = completedCount;
        document.getElementById('completed-badge-count').textContent = completedCount;
        document.getElementById('resources-count').textContent = resourcesCount;
        document.getElementById('total-tasks').textContent = totalCount;
    }
    
    /**
     * Utility functions
     */
    findTask(taskId) {
        for (const column of this.data.columns) {
            const task = column.items.find(item => item.id === taskId);
            if (task) return task;
        }
        return null;
    }
    
    getPriorityBadgeClass(priority) {
        switch (priority) {
            case 'high': return 'bg-high';
            case 'medium': return 'bg-medium';
            case 'low': return 'bg-low';
            default: return 'bg-medium';
        }
    }
    
    formatTimestamp(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        const toastId = 'toast-' + Date.now();
        const iconClass = type === 'success' ? 'bi-check-circle' : type === 'error' ? 'bi-exclamation-triangle' : 'bi-info-circle';
        const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-primary';
        
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi ${iconClass} me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
        toast.show();
        
        // Remove toast element after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.kanbanApp = new TeamKanbanBoard();
});
