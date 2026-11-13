
const STORAGE_KEY = "taskflow.tasks.v1";

const taskList = document.querySelector("#taskList");
const emptyState = document.querySelector("#emptyState");
const modalBackdrop = document.querySelector("#modalBackdrop");
const taskForm = document.querySelector("#taskForm");
const searchInput = document.querySelector("#searchInput");
const sortSelect = document.querySelector("#sortSelect");

let tasks = loadTasks();
let currentFilter = "all";

// CARREGAR TAREFAS
function loadTasks() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

// GUARDAR TAREFAS
function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// MOSTRAR MENSAGEM
function showToast(message) {
    const toast = document.querySelector("#toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2400);
}

// ABRIR MODAL
function openModal() {
    taskForm.reset();

    document.querySelector("#formError").textContent = "";

    modalBackdrop.classList.add("open");
    modalBackdrop.setAttribute("aria-hidden", "false");

    document.querySelector("#taskTitle").focus();
}

// FECHAR MODAL
function closeModal() {
    modalBackdrop.classList.remove("open");
    modalBackdrop.setAttribute("aria-hidden", "true");
}

// FORMATAR DATA
function formatDate(dateString) {
    if (!dateString) return "";

    const [year, month, day] = dateString.split("-");

    return `${day}/${month}/${year}`;
}

// ATUALIZAR ESTATÍSTICAS
function updateStats() {
    const completed = tasks.filter(task => task.completed).length;
    const pending = tasks.length - completed;

    document.querySelector("#totalStat").textContent = tasks.length;
    document.querySelector("#pendingStat").textContent = pending;
    document.querySelector("#doneStat").textContent = completed;

    document.querySelector("#allCount").textContent = tasks.length;
    document.querySelector("#pendingCount").textContent = pending;
    document.querySelector("#completedCount").textContent = completed;
}

// FILTRAR E ORDENAR
function getVisibleTasks() {
    const term = searchInput.value.trim().toLowerCase();

    let result = tasks.filter(task => {
        const matchesFilter =
            currentFilter === "all" ||
            (currentFilter === "pending" && !task.completed) ||
            (currentFilter === "completed" && task.completed);

        const matchesSearch =
            task.title.toLowerCase().includes(term) ||
            task.description.toLowerCase().includes(term);

        return matchesFilter && matchesSearch;
    });

    const sortMode = sortSelect.value;

    if (sortMode === "newest") {
        result.sort((a, b) => b.createdAt - a.createdAt);
    }

    if (sortMode === "oldest") {
        result.sort((a, b) => a.createdAt - b.createdAt);
    }

    if (sortMode === "priority") {
        const rank = { high: 0, normal: 1, low: 2 };

        result.sort((a, b) => rank[a.priority] - rank[b.priority]);
    }

    return result;
}

// MOSTRAR TAREFAS
function renderTasks() {
    updateStats();

    const visibleTasks = getVisibleTasks();

    taskList.innerHTML = "";

    const titles = {
        all: "Todas as tarefas",
        pending: "Tarefas pendentes",
        completed: "Tarefas concluídas"
    };

    document.querySelector("#listTitle").textContent = titles[currentFilter];

    emptyState.classList.toggle("show", visibleTasks.length === 0);

    if (visibleTasks.length === 0) {
        emptyState.querySelector("h3").textContent =
            searchInput.value.trim()
                ? "Nenhum resultado encontrado"
                : "Ainda não há tarefas aqui";

        emptyState.querySelector("p").textContent =
            searchInput.value.trim()
                ? "Experimenta pesquisar com outras palavras."
                : "Adiciona uma tarefa para começares a organizar o teu dia.";
    }

    visibleTasks.forEach(task => {
        const card = document.createElement("article");

        card.className = `task-card${task.completed ? " completed" : ""}`;

        const check = document.createElement("button");

        check.className = "check-button";
        check.type = "button";
        check.textContent = task.completed ? "✓" : "";

        check.addEventListener("click", () => toggleTask(task.id));

        const body = document.createElement("div");
        body.className = "task-body";

        const title = document.createElement("p");
        title.className = "task-title";
        title.textContent = task.title;

        const description = document.createElement("p");
        description.className = "task-description";
        description.textContent = task.description || "Sem descrição";

        body.append(title, description);

        const meta = document.createElement("div");
        meta.className = "task-meta";

        const priority = document.createElement("span");

        priority.className = `priority ${task.priority}`;

        priority.textContent = {
            high: "Alta",
            normal: "Normal",
            low: "Baixa"
        }[task.priority];

        meta.append(priority);

        if (task.dueDate) {
            const due = document.createElement("span");

            due.className = "due-date";
            due.textContent = formatDate(task.dueDate);

            meta.append(due);
        }

        const remove = document.createElement("button");

        remove.className = "delete-button";
        remove.type = "button";
        remove.textContent = "×";

        remove.addEventListener("click", () => deleteTask(task.id));

        card.append(check, body, meta, remove);

        taskList.append(card);
    });
}

// ADICIONAR TAREFA
function addTask(event) {
    event.preventDefault();

    const title = document.querySelector("#taskTitle").value.trim();

    const description = document.querySelector("#taskDescription").value.trim();

    const priority = document.querySelector("#taskPriority").value;

    const dueDate = document.querySelector("#taskDate").value;

    const error = document.querySelector("#formError");

    if (title.length < 2) {
        error.textContent = "O título deve ter pelo menos 2 caracteres.";
        return;
    }

    tasks.push({
        id: crypto.randomUUID(),
        title,
        description,
        priority,
        dueDate,
        completed: false,
        createdAt: Date.now()
    });

    saveTasks();

    closeModal();

    renderTasks();

    showToast("Tarefa adicionada com sucesso!");
}

// CONCLUIR OU REABRIR
function toggleTask(id) {
    tasks = tasks.map(task =>
        task.id === id
            ? { ...task, completed: !task.completed }
            : task
    );

    saveTasks();

    renderTasks();
}

// ELIMINAR TAREFA
function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);

    saveTasks();

    renderTasks();

    showToast("Tarefa eliminada.");
}

// FILTROS
document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        document.querySelectorAll(".nav-item").forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");

        renderTasks();
    });
});

// BOTÕES DO MODAL
document.querySelector("#openModal").addEventListener("click", openModal);

document.querySelector("#emptyAdd").addEventListener("click", openModal);

document.querySelector("#closeModal").addEventListener("click", closeModal);

document.querySelector("#cancelModal").addEventListener("click", closeModal);

// FECHAR AO CLICAR FORA
modalBackdrop.addEventListener("click", event => {
    if (event.target === modalBackdrop) {
        closeModal();
    }
});

// FECHAR COM ESC
document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeModal();
    }
});

// EVENTOS DO FORMULÁRIO
taskForm.addEventListener("submit", addTask);

// PESQUISAR
searchInput.addEventListener("input", renderTasks);

// ORDENAR
sortSelect.addEventListener("change", renderTasks);

// DATA ATUAL
const today = new Date();

document.querySelector("#todayLabel").textContent =
    new Intl.DateTimeFormat("pt-PT", {
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(today);

// INICIAR A APLICAÇÃO
renderTasks();
