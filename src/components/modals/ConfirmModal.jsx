import Modal from './Modal.jsx';

export default function ConfirmModal({ modal, onClose }) {
  return (
    <Modal onClose={onClose}>
      <div className="modal-hdr">
        <div><h3>{modal.title}</h3></div>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        <p style={{ color: 'var(--t2)', lineHeight: 1.65 }}>{modal.msg}</p>
      </div>
      <div className="modal-foot">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger" onClick={() => { modal.onConfirm?.(); onClose(); }}>Confirm</button>
      </div>
    </Modal>
  );
}
