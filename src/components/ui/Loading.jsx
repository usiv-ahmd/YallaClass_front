// src/components/ui/Loading.jsx
import "../../styles/loading.css";

export default function Loading({ title, description }) {
  return (
    <main className="card loading-card" role="status" aria-atomic="true" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <div className="content">
        <strong className="title">
          {title}
        </strong>
        <p className="description">
          {description}
        </p>
      </div>
    </main>
  );
}