class ModalEditar {
    constructor() {
        this.modalElement = null;
        this.formElement = null;
        this.onSubmitCallback = null;
        this.initializeModal();
    }

    initializeModal() {
        // Crear el elemento del modal si no existe
        if (!document.getElementById('modalEditarEstudiante')) {
            this.createModalElement();
        } else {
            this.modalElement = new bootstrap.Modal(document.getElementById('modalEditarEstudiante'));
            this.formElement = document.getElementById('formEditarEstudiante');
        }
        
        // Inicializar el modal de Bootstrap
        this.initializeEventListeners();
    }

    createModalElement() {
        // Verificar si el modal ya existe
        if (document.getElementById('modalEditarEstudiante')) {
            this.modalElement = new bootstrap.Modal(document.getElementById('modalEditarEstudiante'));
            this.formElement = document.getElementById('formEditarEstudiante');
            return;
        }

        const modalHTML = `
            <div class="modal fade modal-editar" id="modalEditarEstudiante" tabindex="-1" aria-labelledby="modalEditarEstudianteLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="modalEditarEstudianteLabel">
                                <i class="bi bi-pencil-square me-2"></i>
                                <span>Editar Estudiante</span>
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                        </div>
                        <form id="formEditarEstudiante">
                            <div class="modal-body">
                                <input type="hidden" id="editarId">
                                <div class="mb-3">
                                    <label for="editarNombre" class="form-label">Nombre Completo</label>
                                    <input type="text" class="form-control" id="editarNombre" required>
                                </div>
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="editarCu" class="form-label">Carnet Universitario</label>
                                        <input type="text" class="form-control" id="editarCu" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="editarGrupo" class="form-label">Grupo</label>
                                        <select class="form-select" id="editarGrupo" required>
                                            <option value="" disabled>Selecciona un grupo</option>
                                            <option value="A1">A1</option>
                                            <option value="A2">A2</option>
                                            <option value="B1">B1</option>
                                            <option value="B2">B2</option>
                                            <option value="C1">C1</option>
                                            <option value="C2">C2</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="editarCelular" class="form-label">Celular</label>
                                        <div class="input-group">
                                            <input type="tel" class="form-control" id="editarCelular" required>
                                            <button class="btn btn-outline-secondary" type="button" id="editarGenerarCelular">
                                                <i class="bi bi-shuffle"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                <label for="editarGmail" class="form-label">Gmail</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" id="editarGmail" placeholder="nombredeusuario" required>
                                    <span class="input-group-text">@gmail.com</span>
                                </div>
                            </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                                    <i class="bi bi-x-lg me-1"></i> Cancelar
                                </button>
                                <button type="submit" class="btn btn-primary" id="btnGuardarCambios">
                                    <i class="bi bi-save me-1"></i> Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Agregar el modal al final del body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Inicializar el modal de Bootstrap
        const modalElement = document.getElementById('modalEditarEstudiante');
        if (modalElement) {
            this.modalElement = new bootstrap.Modal(modalElement);
            this.formElement = document.getElementById('formEditarEstudiante');
            
            // Inicializar tooltips
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });

            // Manejador para el botón de generar celular en el modal
            document.getElementById('editarGenerarCelular')?.addEventListener('click', () => {
                // Usamos la función global desde main.js
                if (window.generarNumeroCelular) {
                    document.getElementById('editarCelular').value = window.generarNumeroCelular();
                } else {
                    // Si por alguna razón no está disponible, usamos una implementación local
                    const digitos = Array.from({length: 7}, () => Math.floor(Math.random() * 10)).join('');
                    document.getElementById('editarCelular').value = '7' + digitos;
                }
            });
            
            // Inicializar los event listeners
            this.initializeEventListeners();
        }
    }

    initializeEventListeners() {
        if (!this.formElement || !this.modalElement) return;
        
        // Manejar el envío del formulario
        this.formElement.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Limpiar el modal cuando se cierre
        const modalElement = document.getElementById('modalEditarEstudiante');
        if (modalElement) {
            modalElement.addEventListener('hidden.bs.modal', () => {
                if (this.formElement) {
                    this.formElement.reset();
                }
            });
        }
    }

    show(estudiante) {
        // Llenar el formulario con los datos del estudiante
        document.getElementById('editarId').value = estudiante.id || '';
        document.getElementById('editarNombre').value = estudiante.nombre || '';
        document.getElementById('editarCu').value = estudiante.cu || '';
        document.getElementById('editarGrupo').value = estudiante.grupo || '';
        document.getElementById('editarCelular').value = estudiante.celular || '';
        
        // Extraer solo el nombre de usuario del correo
        let gmail = estudiante.gmail || '';
        gmail = gmail.replace(/@gmail\.com$/i, '');
        document.getElementById('editarGmail').value = gmail;
        
        // Mostrar el modal
        this.modalElement.show();
    }

    hide() {
        if (this.modalElement) {
            this.modalElement.hide();
        }
    }

    setLoading(loading) {
        const submitBtn = document.getElementById('btnGuardarCambios');
        if (loading) {
            submitBtn.classList.add('btn-save-loading');
            submitBtn.disabled = true;
        } else {
            submitBtn.classList.remove('btn-save-loading');
            submitBtn.disabled = false;
        }
    }

    setOnSubmit(callback) {
        this.onSubmitCallback = callback;
    }

    async handleSubmit() {
        if (!this.onSubmitCallback) return;

        // Obtener el valor del campo Gmail y asegurarse de que no tenga @gmail.com duplicado
        let gmail = document.getElementById('editarGmail').value.trim();
        // Eliminar @gmail.com si el usuario lo escribió manualmente
        gmail = gmail.replace(/@gmail\.com$/i, '');
        const gmailCompleto = gmail + '@gmail.com';

        const estudiante = {
            id: document.getElementById('editarId').value,
            nombre: document.getElementById('editarNombre').value.trim(),
            cu: document.getElementById('editarCu').value.trim(),
            grupo: document.getElementById('editarGrupo').value.trim(),
            celular: document.getElementById('editarCelular').value.trim(),
            gmail: gmailCompleto
        };

        // Validación básica
        if (!estudiante.nombre || !estudiante.cu || !estudiante.grupo || !estudiante.gmail) {
            mostrarMensaje('Por favor completa todos los campos obligatorios', 'warning');
            return;
        }

        this.setLoading(true);

        try {
            await this.onSubmitCallback(estudiante);
            this.hide();
        } catch (error) {
            console.error('Error al guardar los cambios:', error);
            mostrarMensaje(`❌ ${error.message || 'Error al guardar los cambios'}`, 'danger');
        } finally {
            this.setLoading(false);
        }
    }
}

// Crear una instancia global del modal
const modalEditar = new ModalEditar();
