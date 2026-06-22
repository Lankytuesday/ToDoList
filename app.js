import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAnalytics, isSupported as analyticsSupported } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-analytics.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = globalThis.FIREBASE_CONFIG;

if (!firebaseConfig) {
  throw new Error("Missing Firebase config. Define window.FIREBASE_CONFIG in env.js.");
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const listDocRef = doc(db, "todoLists", "shared");
const todosRef = collection(listDocRef, "items");

const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const status = document.querySelector("#status");
const list = document.querySelector("#todo-list");
const submitButton = form.querySelector("button");

function todoDocRef(id) {
  return doc(listDocRef, "items", id);
}

async function setupAnalytics() {
  if (await analyticsSupported()) {
    getAnalytics(app);
  }
}

async function ensureListDocument() {
  await setDoc(
    listDocRef,
    {
      title: "Shared To-do List",
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

function setStatus(message, isError = false) {
  status.textContent = message;
  status.style.color = isError ? "#a12222" : "";
}

function renderEmptyState(message) {
  list.innerHTML = "";
  const item = document.createElement("li");
  item.className = "todo-item empty";
  item.textContent = message;
  list.append(item);
}

function renderTodos(snapshot) {
  list.innerHTML = "";

  if (snapshot.empty) {
    renderEmptyState("No tasks yet. Add the first one.");
    return;
  }

  for (const todoDoc of snapshot.docs) {
    const todo = todoDoc.data();
    const item = document.createElement("li");
    item.className = `todo-item${todo.completed ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.className = "todo-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(todo.completed);
    checkbox.setAttribute("aria-label", `Mark ${todo.text} as complete`);
    checkbox.addEventListener("change", async () => {
      try {
        await updateDoc(todoDocRef(todoDoc.id), {
          completed: checkbox.checked,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        checkbox.checked = !checkbox.checked;
        setStatus(`Could not update task: ${error.message}`, true);
      }
    });

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;

    const removeButton = document.createElement("button");
    removeButton.className = "todo-action";
    removeButton.type = "button";
    removeButton.textContent = "Delete";
    removeButton.addEventListener("click", async () => {
      try {
        await deleteDoc(todoDocRef(todoDoc.id));
      } catch (error) {
        setStatus(`Could not delete task: ${error.message}`, true);
      }
    });

    item.append(checkbox, text, removeButton);
    list.append(item);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();

  if (!text) {
    return;
  }

  submitButton.disabled = true;
  setStatus("Saving task...");

  try {
    await ensureListDocument();
    await addDoc(todosRef, {
      text,
      completed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    input.value = "";
    input.focus();
    setStatus("Task saved.");
  } catch (error) {
    setStatus(`Could not save task: ${error.message}`, true);
  } finally {
    submitButton.disabled = false;
  }
});

setupAnalytics().catch(() => {
  // Analytics is optional for this app.
});

setStatus("Loading tasks...");

ensureListDocument().catch((error) => {
  setStatus(`Could not initialize list: ${error.message}`, true);
});

onSnapshot(
  query(todosRef, orderBy("createdAt", "asc")),
  (snapshot) => {
    renderTodos(snapshot);
    setStatus(`${snapshot.size} task${snapshot.size === 1 ? "" : "s"} loaded.`);
  },
  (error) => {
    renderEmptyState("Could not load tasks.");
    setStatus(`Firestore connection failed: ${error.message}`, true);
  },
);
