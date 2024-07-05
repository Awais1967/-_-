document.addEventListener('DOMContentLoaded', () => {
    const add = document.getElementById("add");
    const updateButton = document.getElementById("update");
    const table = document.getElementById("table");
    const currentImage = document.getElementById("current-image");
    const pagination = document.getElementById('pagination');
    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');
    const pageInfo = document.getElementById('page-info');
    const rowsPerPage = 5; // Number of rows per page
    let currentPage = 1;
    let totalRows = 0;
    let totalPages = 0;

    const enableDragAndDrop = () => {
        let draggingRow;

        table.addEventListener('dragstart', (event) => {
            draggingRow = event.target;
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/html', draggingRow.innerHTML);
        });

        table.addEventListener('dragover', (event) => {
            event.preventDefault();
        });

        table.addEventListener('dragenter', (event) => {
            if (event.target.closest('tr')) {
                event.target.closest('tr').classList.add('drag-over');
            }
        });

        table.addEventListener('dragleave', (event) => {
            if (event.target.closest('tr')) {
                event.target.closest('tr').classList.remove('drag-over');
            }
        });

        table.addEventListener('drop', (event) => {
            event.preventDefault();
            const targetRow = event.target.closest('tr');
            if (targetRow && targetRow !== draggingRow) {
                draggingRow.innerHTML = targetRow.innerHTML;
                targetRow.innerHTML = event.dataTransfer.getData('text/html');
                saveTableToLocalStorage();
                updatePagination();
            }
            targetRow.classList.remove('drag-over');
        });

        table.addEventListener('dragend', () => {
            draggingRow = null;
            saveTableToLocalStorage();
            updatePagination();
        });
    };

    const searchFunc = () => {
        const searchInput = document.getElementById('search');
        const searchText = searchInput.value.toUpperCase().trim();
        const tableRows = table.querySelectorAll('tbody tr');

        tableRows.forEach((row) => {
            const cells = row.querySelectorAll('td');
            row.style.display = Array.from(cells).some(cell =>
                cell.textContent.toUpperCase().includes(searchText)
            ) ? '' : 'none';
        });
        updatePagination();
    };

    const addTask = (event) => {
        event.preventDefault();
        const taskno = document.getElementById("taskno").value;
        const title = document.getElementById("title").value;
        const description = document.getElementById("description").value;
        const imageInput = document.getElementById("image1");
        const imageFile = imageInput.files[0];

        if (taskno && title && description && imageFile) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const imageSrc = event.target.result;
                addRowToTable(taskno, title, description, imageSrc);
                saveTaskToLocalStorage({ taskno, title, description, image: imageSrc });
                clearForm();
                updatePagination();
            };
            reader.readAsDataURL(imageFile);
        }
    };

    const addRowToTable = (taskno, title, description, imageSrc) => {
        const newRow = document.createElement('tr');
        newRow.setAttribute('draggable', 'true');
        newRow.innerHTML = `
            <td>${taskno}</td>
            <td>${title}</td>
            <td>${description}</td>
            <td><img src="${imageSrc}" alt="Task Image" style="max-width: 100px;"></td>
            <td>
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </td>
        `;
        table.querySelector('tbody').appendChild(newRow);
    };

    const saveTaskToLocalStorage = (task) => {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.push(task);
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    const loadTasksFromLocalStorage = () => {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.forEach(task => addRowToTable(task.taskno, task.title, task.description, task.image));
        updatePagination();
    };

    const saveTableToLocalStorage = () => {
        const rows = document.querySelectorAll('#table tbody tr');
        const tasks = [];
        rows.forEach((row) => {
            const cells = row.querySelectorAll('td');
            tasks.push({
                taskno: cells[0].textContent,
                title: cells[1].textContent,
                description: cells[2].textContent,
                image: cells[3].querySelector('img').src,
            });
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    const onEdit = (selectedRow) => {
        const cells = selectedRow.querySelectorAll('td');
        document.getElementById('taskno').value = cells[0].textContent;
        document.getElementById('title').value = cells[1].textContent;
        document.getElementById('description').value = cells[2].textContent;
        currentImage.src = cells[3].querySelector('img').src;

        add.style.display = 'none';
        updateButton.style.display = 'inline-block';
        updateButton.onclick = () => onUpdate(selectedRow);
    };

    const onUpdate = (selectedRow) => {
        const taskno = document.getElementById("taskno").value;
        const title = document.getElementById("title").value;
        const description = document.getElementById("description").value;
        const imageInput = document.getElementById("image1");
        const imageFile = imageInput.files[0];

        if (taskno && title && description) {
            if (imageFile) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    const imageSrc = event.target.result;
                    updateRowInTable(selectedRow, taskno, title, description, imageSrc);
                    updateTaskInLocalStorage(selectedRow.rowIndex - 1, { taskno, title, description, image: imageSrc });
                    updatePagination();
                };
                reader.readAsDataURL(imageFile);
            } else {
                const currentImageSrc = selectedRow.querySelector('img').src;
                updateRowInTable(selectedRow, taskno, title, description, currentImageSrc);
                updateTaskInLocalStorage(selectedRow.rowIndex - 1, { taskno, title, description, image: currentImageSrc });
                updatePagination();
            }

            add.style.display = 'inline-block';
            updateButton.style.display = 'none';
            clearForm();
        }
    };

    const updateRowInTable = (row, taskno, title, description, imageSrc) => {
        const cells = row.querySelectorAll('td');
        cells[0].textContent = taskno;
        cells[1].textContent = title;
        cells[2].textContent = description;
        cells[3].querySelector('img').src = imageSrc;
    };

    const updateTaskInLocalStorage = (index, updatedTask) => {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks[index] = updatedTask;
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    const onDelete = (selectedRow) => {
        selectedRow.remove();
        deleteTaskFromLocalStorage(selectedRow.rowIndex - 1);
        updatePagination();
    };

    const deleteTaskFromLocalStorage = (index) => {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.splice(index, 1);
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    const clearForm = () => {
        document.getElementById("taskno").value = '';
        document.getElementById("title").value = '';
        document.getElementById("description").value = '';
        document.getElementById("image1").value = '';
        currentImage.src = '';
    };

    const updatePagination = () => {
        const rows = table.querySelectorAll('tbody tr');
        totalRows = rows.length;
        totalPages = Math.ceil(totalRows / rowsPerPage);

        // Show or hide the pagination buttons
        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === totalPages;

        // Update page information
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

        // Show the rows for the current page and hide others
        rows.forEach((row, index) => {
            row.style.display = (index >= (currentPage - 1) * rowsPerPage && index < currentPage * rowsPerPage) ? '' : 'none';
        });
    };

    const goToPage = (page) => {
        currentPage = page;
        updatePagination();
    };

    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            goToPage(currentPage + 1);
        }
    });

    document.getElementById("form1").addEventListener("submit", addTask);
    document.getElementById("search").addEventListener("input", searchFunc);
    table.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('edit-btn')) {
            const selectedRow = target.closest('tr');
            onEdit(selectedRow);
        } else if (target.classList.contains('delete-btn')) {
            const selectedRow = target.closest('tr');
            onDelete(selectedRow);
        }
    });

    loadTasksFromLocalStorage();
    enableDragAndDrop();
    updatePagination();
});
