import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";

type Status = "todo" | "doing" | "done";
type Priority = "low" | "medium" | "high";

type Task = {
  id: string;
  title: string;
  notes: string;
  status: Status;
  priority: Priority;
  createdAt: number;
};

const STORAGE_KEY = "taskflow.tasks.v2";

const COLUMNS: { id: Status; label: string; hint: string }[] = [
  { id: "todo", label: "To do", hint: "Queued work" },
  { id: "doing", label: "Doing", hint: "In progress" },
  { id: "done", label: "Done", hint: "Shipped" },
];

const PRIORITIES: Priority[] = ["low", "medium", "high"];

const SEED: Task[] = [
  {
    id: "seed-1",
    title: "Polish README",
    notes: "Add screenshots and a clear quick-start.",
    status: "todo",
    priority: "medium",
    createdAt: Date.now() - 1000 * 60 * 60,
  },
  {
    id: "seed-2",
    title: "Ship public demo",
    notes: "Push taskflow to GitHub as a public repo.",
    status: "doing",
    priority: "high",
    createdAt: Date.now() - 1000 * 60 * 30,
  },
];

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw) as Task[];
    if (!Array.isArray(parsed)) return SEED;
    return parsed.map((task) => ({
      ...task,
      priority: task.priority ?? "medium",
    }));
  } catch {
    return SEED;
  }
}

function uid(): string {
  return crypto.randomUUID();
}

function priorityRank(priority: Priority): number {
  return { high: 0, medium: 1, low: 2 }[priority];
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [query, setQuery] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = !q
      ? tasks
      : tasks.filter(
          (task) =>
            task.title.toLowerCase().includes(q) ||
            task.notes.toLowerCase().includes(q),
        );

    return [...list].sort(
      (a, b) =>
        priorityRank(a.priority) - priorityRank(b.priority) ||
        b.createdAt - a.createdAt,
    );
  }, [tasks, query]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    setTasks((current) => [
      {
        id: uid(),
        title: cleanTitle,
        notes: notes.trim(),
        status: "todo",
        priority,
        createdAt: Date.now(),
      },
      ...current,
    ]);
    setTitle("");
    setNotes("");
    setPriority("medium");
  }

  function moveTask(id: string, status: Status) {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, status } : task)),
    );
  }

  function cyclePriority(id: string) {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== id) return task;
        const index = PRIORITIES.indexOf(task.priority);
        const next = PRIORITIES[(index + 1) % PRIORITIES.length];
        return { ...task, priority: next };
      }),
    );
  }

  function removeTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  function clearDone() {
    setTasks((current) => current.filter((task) => task.status !== "done"));
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "taskflow-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function importJson(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Task[];
        if (!Array.isArray(parsed)) {
          window.alert("Invalid Taskflow export file.");
          return;
        }
        const normalized = parsed
          .filter((task) => task && typeof task.title === "string")
          .map((task) => ({
            id: typeof task.id === "string" ? task.id : uid(),
            title: task.title.trim(),
            notes: typeof task.notes === "string" ? task.notes : "",
            status: (["todo", "doing", "done"] as Status[]).includes(task.status)
              ? task.status
              : ("todo" as Status),
            priority: (["low", "medium", "high"] as Priority[]).includes(
              task.priority,
            )
              ? task.priority
              : ("medium" as Priority),
            createdAt:
              typeof task.createdAt === "number" ? task.createdAt : Date.now(),
          }))
          .filter((task) => task.title.length > 0);

        setTasks(normalized);
      } catch {
        window.alert("Could not parse JSON file.");
      }
    };
    reader.readAsText(file);
  }

  const counts = {
    todo: tasks.filter((t) => t.status === "todo").length,
    doing: tasks.filter((t) => t.status === "doing").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  return (
    <div className="page">
      <header className="hero">
        <div className="brand-block">
          <p className="eyebrow">Local-first board</p>
          <h1>Taskflow</h1>
          <p className="lede">
            A lightweight kanban board that lives in your browser. Add work,
            set priority, move it across columns, and keep momentum without an
            account.
          </p>
        </div>

        <div className="stats" aria-label="Board stats">
          <div>
            <strong>{counts.todo}</strong>
            <span>to do</span>
          </div>
          <div>
            <strong>{counts.doing}</strong>
            <span>doing</span>
          </div>
          <div>
            <strong>{counts.done}</strong>
            <span>done</span>
          </div>
        </div>
      </header>

      <section className="composer" aria-label="Create task">
        <form onSubmit={onSubmit}>
          <label>
            Task title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Write Web Summit application notes"
              maxLength={80}
              required
            />
          </label>
          <label>
            Notes
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional context"
              maxLength={160}
            />
          </label>
          <label>
            Priority
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <button type="submit">Add task</button>
        </form>

        <div className="toolbar">
          <label className="search">
            Search
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by title or notes"
            />
          </label>
          <label className="ghost file-button">
            Import JSON
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                importJson(e.target.files?.[0] ?? null);
                e.currentTarget.value = "";
              }}
            />
          </label>
          <button type="button" className="ghost" onClick={exportJson}>
            Export JSON
          </button>
          <button type="button" className="ghost" onClick={clearDone}>
            Clear done
          </button>
        </div>
      </section>

      <section className="board" aria-label="Task board">
        {COLUMNS.map((column) => {
          const columnTasks = filtered.filter(
            (task) => task.status === column.id,
          );

          return (
            <article key={column.id} className="column">
              <header>
                <h2>{column.label}</h2>
                <p>{column.hint}</p>
              </header>

              <ul>
                {columnTasks.length === 0 ? (
                  <li className="empty">Nothing here yet.</li>
                ) : (
                  columnTasks.map((task) => (
                    <li key={task.id} className="task">
                      <div className="task-top">
                        <h3>{task.title}</h3>
                        <button
                          type="button"
                          className="icon"
                          onClick={() => removeTask(task.id)}
                          aria-label={`Delete ${task.title}`}
                        >
                          ×
                        </button>
                      </div>
                      <button
                        type="button"
                        className={`priority priority-${task.priority}`}
                        onClick={() => cyclePriority(task.id)}
                        aria-label={`Priority ${task.priority}, click to change`}
                      >
                        {task.priority}
                      </button>
                      {task.notes ? <p>{task.notes}</p> : null}
                      <div className="moves">
                        {COLUMNS.filter((c) => c.id !== task.status).map(
                          (target) => (
                            <button
                              key={target.id}
                              type="button"
                              onClick={() => moveTask(task.id, target.id)}
                            >
                              → {target.label}
                            </button>
                          ),
                        )}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </article>
          );
        })}
      </section>

      <footer className="footer">
        <p>
          Data stays in <code>localStorage</code>. Refresh-safe. No backend.
        </p>
      </footer>
    </div>
  );
}
