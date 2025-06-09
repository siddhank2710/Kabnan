// Kanban Board Application
class KanbanBoard {
    constructor() {
        this.data = {
            columns: [
                {
                    id: "agenda",
                    title: "Agenda/To Cover Today",
                    items: []
                },
                {
                    id: "completed",
                    title: "Completed",
                    items: []
                },
                {
                    id: "resources",
                    title: "Resources",
                    items: []
                }
            ]
        };
        
        this.currentColumn = null;
        this.itemIdCounter = 4; // Start from 4 since we have 3 initial items
        
        this.init();
    }
    
    init() {
        this.renderBoard();
        this.setupEventListeners();
    }
    
    renderBoard() {
        this.data.columns.forEach(column => {
            const columnElement = document.getElementById(`${column.id}-column`);
            columnElement.innerHTML = '';
            
            column.items.forEach(item => {
                const itemElement = this.createItemElement(item);
                columnElement.appendChild(itemElement);
            });
        });
    }
    
    createItemElement(item) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'kanban-item';
        itemDiv.draggable = true;
        itemDiv.dataset.itemId = item.id;
        
        itemDiv.innerHTML = `
            <div class="kanban-item-content">${this.escapeHtml(item.text)}</div>
            <button class="delete-btn" data-item-id="${item.id}">&times;</button>
        `;
        
        // Add drag event listeners
        itemDiv.addEventListener('dragstart', this.handleDragStart.bind(this));
        itemDiv.addEventListener('dragend', this.handleDragEnd.bind(this));
        
        // Add delete event listener
        const deleteBtn = itemDiv.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteItem(item.id);
        });
        
        return itemDiv;
    }
    
    setupEventListeners() {
        // Add item buttons
        document.querySelectorAll('.add-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentColumn = e.target.dataset.column;
                this.showModal();
            });
        });
        
        // Modal event listeners
        document.getElementById('modal-close').addEventListener('click', this.hideModal.bind(this));
        document.getElementById('cancel-btn').addEventListener('click', this.hideModal.bind(this));
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideModal();
            }
        });
        
        // Form submission
        document.getElementById('add-item-form').addEventListener('submit', this.handleAddItem.bind(this));
        
        // Setup drop zones
        document.querySelectorAll('.column-content').forEach(column => {
            column.addEventListener('dragover', this.handleDragOver.bind(this));
            column.addEventListener('drop', this.handleDrop.bind(this));
            column.addEventListener('dragenter', this.handleDragEnter.bind(this));
            column.addEventListener('dragleave', this.handleDragLeave.bind(this));
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });
    }
    
    handleDragStart(e) {
        const itemId = e.target.dataset.itemId;
        e.dataTransfer.setData('text/plain', itemId);
        e.target.classList.add('dragging');
        
        // Store the source column
        const sourceColumn = e.target.closest('.column').dataset.column;
        e.dataTransfer.setData('source-column', sourceColumn);
    }
    
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }
    
    handleDragOver(e) {
        e.preventDefault();
    }
    
    handleDragEnter(e) {
        e.preventDefault();
        if (e.target.classList.contains('column-content')) {
            e.target.classList.add('drag-over');
        }
    }
    
    handleDragLeave(e) {
        if (e.target.classList.contains('column-content')) {
            // Only remove if we're actually leaving the column
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX;
            const y = e.clientY;
            
            if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                e.target.classList.remove('drag-over');
            }
        }
    }
    
    handleDrop(e) {
        e.preventDefault();
        const columnContent = e.target.closest('.column-content');
        if (!columnContent) return;
        
        columnContent.classList.remove('drag-over');
        
        const itemId = e.dataTransfer.getData('text/plain');
        const sourceColumn = e.dataTransfer.getData('source-column');
        const targetColumn = e.target.closest('.column').dataset.column;
        
        if (sourceColumn !== targetColumn) {
            this.moveItem(itemId, sourceColumn, targetColumn);
        }
    }
    
    moveItem(itemId, sourceColumnId, targetColumnId) {
        const sourceColumn = this.data.columns.find(col => col.id === sourceColumnId);
        const targetColumn = this.data.columns.find(col => col.id === targetColumnId);
        
        const itemIndex = sourceColumn.items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return;
        
        const item = sourceColumn.items.splice(itemIndex, 1)[0];
        targetColumn.items.push(item);
        
        this.renderBoard();
    }
    
    showModal() {
        document.getElementById('modal-overlay').classList.add('active');
        document.getElementById('item-text').focus();
    }
    
    hideModal() {
        document.getElementById('modal-overlay').classList.remove('active');
        document.getElementById('add-item-form').reset();
    }
    
    handleAddItem(e) {
        e.preventDefault();
        const text = document.getElementById('item-text').value.trim();
        
        if (!text) return;
        
        const newItem = {
            id: `item${this.itemIdCounter++}`,
            text: text
        };
        
        const column = this.data.columns.find(col => col.id === this.currentColumn);
        column.items.push(newItem);
        
        this.renderBoard();
        this.hideModal();
    }
    
    deleteItem(itemId) {
        if (!confirm('Are you sure you want to delete this item?')) {
            return;
        }
        
        this.data.columns.forEach(column => {
            const itemIndex = column.items.findIndex(item => item.id === itemId);
            if (itemIndex !== -1) {
                column.items.splice(itemIndex, 1);
            }
        });
        
        this.renderBoard();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}

// Initialize the Kanban Board when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const kanban = new KanbanBoard();

    // Set current date in header
    const currentDateElem = document.getElementById('current-date');
    if (currentDateElem) {
        const now = new Date();
        currentDateElem.textContent = formatDate(now);
    }
});

// Add some visual feedback for better UX
document.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('kanban-item')) {
        document.body.style.cursor = 'grabbing';
    }
});

document.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('kanban-item')) {
        document.body.style.cursor = 'default';
        // Remove any remaining drag-over classes
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
    }
});

// Add touch support for mobile devices
let touchItem = null;
let touchOffset = { x: 0, y: 0 };

document.addEventListener('touchstart', (e) => {
    if (e.target.closest('.kanban-item')) {
        touchItem = e.target.closest('.kanban-item');
        const rect = touchItem.getBoundingClientRect();
        touchOffset.x = e.touches[0].clientX - rect.left;
        touchOffset.y = e.touches[0].clientY - rect.top;
        
        touchItem.style.position = 'fixed';
        touchItem.style.zIndex = '1000';
        touchItem.style.pointerEvents = 'none';
        touchItem.classList.add('dragging');
    }
});

document.addEventListener('touchmove', (e) => {
    if (touchItem) {
        e.preventDefault();
        const touch = e.touches[0];
        touchItem.style.left = (touch.clientX - touchOffset.x) + 'px';
        touchItem.style.top = (touch.clientY - touchOffset.y) + 'px';
        
        // Highlight drop zones
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const columnContent = elementBelow?.closest('.column-content');
        
        document.querySelectorAll('.column-content').forEach(col => {
            col.classList.remove('drag-over');
        });
        
        if (columnContent) {
            columnContent.classList.add('drag-over');
        }
    }
});

document.addEventListener('touchend', (e) => {
    if (touchItem) {
        const touch = e.changedTouches[0];
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const targetColumnContent = elementBelow?.closest('.column-content');
        
        if (targetColumnContent) {
            const targetColumn = targetColumnContent.closest('.column').dataset.column;
            const sourceColumn = touchItem.closest('.column').dataset.column;
            const itemId = touchItem.dataset.itemId;
            
            if (sourceColumn !== targetColumn) {
                // Find the kanban instance and move the item
                const kanbanInstance = window.kanbanInstance;
                if (kanbanInstance) {
                    kanbanInstance.moveItem(itemId, sourceColumn, targetColumn);
                }
            }
        }
        
        // Reset styles
        touchItem.style.position = '';
        touchItem.style.zIndex = '';
        touchItem.style.left = '';
        touchItem.style.top = '';
        touchItem.style.pointerEvents = '';
        touchItem.classList.remove('dragging');
        
        document.querySelectorAll('.column-content').forEach(col => {
            col.classList.remove('drag-over');
        });
        
        touchItem = null;
    }
});

// Make the kanban instance globally accessible for touch events
document.addEventListener('DOMContentLoaded', () => {
    window.kanbanInstance = new KanbanBoard();
});
