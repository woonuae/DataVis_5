// Wireframe controls – Group 5, COS30045
// Show or hide the design notes.
const notesBtn = document.getElementById('btn-notes');

notesBtn.addEventListener('click', () => {
  const hidden = document.body.classList.toggle('hide-notes');
  notesBtn.setAttribute('aria-pressed', String(!hidden));
  notesBtn.textContent = hidden ? 'Design notes off' : 'Design notes on';
});
