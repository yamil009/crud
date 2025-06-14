// Variables globales
let estudiantes = [];
let isLoading = false;

// Inicializar el modal de edición
modalEditar.setOnSubmit(actualizarEstudiante);

// Variables para elementos del DOM
let form;
let estudiantesTableBody;
let formTitle;
let btnCancelar;
let confirmarEliminarBtn;
let confirmarEliminarModal;

// Función para inicializar elementos del DOM
function inicializarElementos() {
    form = document.getElementById('estudianteForm');
    estudiantesTableBody = document.getElementById('studentsTableBody');
    formTitle = document.getElementById('formTitle');
    btnCancelar = document.getElementById('btnCancelar');

    const confirmarEliminarModalElement = document.getElementById('confirmarEliminarModal');
    if (confirmarEliminarModalElement) {
        confirmarEliminarModal = new bootstrap.Modal(confirmarEliminarModalElement);
    }

    confirmarEliminarBtn = document.getElementById('confirmarEliminar');
}

// Event Listeners
document.addEventListener('click', (e) => {
    if (e.target.closest('.editar-btn')) {
        const btn = e.target.closest('.editar-btn');
        const estudiante = JSON.parse(btn.dataset.estudiante);
        abrirModalEdicion(estudiante);
    }
});

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar elementos del DOM
    inicializarElementos();

    // Mostrar estado de carga
    const loadingElement = document.getElementById('loadingStudents');
    if (loadingElement) loadingElement.classList.remove('d-none');

    // Cargar estudiantes con un pequeño retraso para la animación
    setTimeout(() => {
        cargarEstudiantes().finally(() => {
            if (loadingElement) loadingElement.classList.add('d-none');
        });
    }, 300);

    // Agregar event listeners
    if (form) form.addEventListener('submit', manejarEnvioFormulario);
    if (confirmarEliminarBtn) confirmarEliminarBtn.addEventListener('click', confirmarEliminacion);
});

// Funciones
async function cargarEstudiantes() {
    try {
        // Mostrar estado de carga
        mostrarEstadoCarga(true);

        const response = await fetch('http://localhost:3000/estudiantes');
        if (!response.ok) throw new Error('Error al cargar los estudiantes');

        estudiantes = await response.json();
        renderizarEstudiantes();
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al cargar los estudiantes: ' + error.message, 'danger');
    } finally {
        // Ocultar estado de carga
        mostrarEstadoCarga(false);
    }
}

// Función para actualizar el contador de estudiantes
function actualizarContadorEstudiantes() {
    const contador = document.getElementById('studentsCount');
    if (contador) {
        contador.textContent = `${estudiantes.length} estudiante${estudiantes.length !== 1 ? 's' : ''}`;
    }
}

function renderizarEstudiantes() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Actualizar el contador
    actualizarContadorEstudiantes();

    if (estudiantes.length === 0) {
        const tr = document.createElement('tr');
        tr.className = 'fade-in';
        tr.innerHTML = `
            <td colspan="7" class="text-center py-5">
                <div class="text-muted">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    No hay estudiantes registrados
                </div>
            </td>
        `;
        tbody.appendChild(tr);
        return;
    }

    estudiantes.forEach((estudiante, index) => {
        const tr = document.createElement('tr');
        tr.className = 'fade-in';
        tr.style.animationDelay = `${index * 0.05}s`;
        tr.innerHTML = `
            <td><span class="badge bg-light text-dark">${estudiante.id}</span></td>
            <td><strong>${estudiante.nombre}</strong></td>
            <td>${estudiante.cu}</td>
            <td><span class="badge bg-light text-primary">${estudiante.grupo}</span></td>
            <td>${formatearTelefono(estudiante.celular) || '-'}</td>
            <td>
                ${estudiante.gmail ? `
                    <a href="mailto:${estudiante.gmail}" class="text-decoration-none">
                        <i class="bi bi-envelope me-1"></i>${estudiante.gmail}
                    </a>` : '-'
            }
            </td>
            <td class="text-end">
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-action btn-warning me-1 editar-btn" 
                        data-estudiante='${JSON.stringify(estudiante)}'
                        data-bs-toggle="tooltip" 
                        title="Editar estudiante">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-action btn-danger" 
                        onclick="solicitarEliminacion(${estudiante.id})"
                        data-bs-toggle="tooltip" 
                        title="Eliminar estudiante">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Inicializar tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

function formatearTelefono(numero) {
    if (!numero) return '';
    // Formato: (XXX) XXX-XXXX
    return numero.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
}

async function manejarEnvioFormulario(e) {
    e.preventDefault();

    // Deshabilitar el botón de enviar
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Procesando...';

    // Obtener el valor del campo Gmail y asegurarse de que no tenga @gmail.com duplicado
    let gmail = document.getElementById('gmail').value.trim();
    // Eliminar @gmail.com si el usuario lo escribió manualmente
    gmail = gmail.replace(/@gmail\.com$/i, '');
    const gmailCompleto = gmail + '@gmail.com';
    
    const estudiante = {
        nombre: document.getElementById('nombre').value.trim(),
        cu: document.getElementById('cu').value.trim(),
        grupo: document.getElementById('grupo').value.trim(),
        celular: document.getElementById('celular').value.trim(),
        gmail: gmailCompleto
    };

    // Validación básica
    if (!estudiante.nombre || !estudiante.cu || !estudiante.grupo || !estudiante.gmail) {
        mostrarMensaje('Por favor completa todos los campos obligatorios', 'warning');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        return;
    }

    try {
        // Crear nuevo estudiante
        const response = await fetch('http://localhost:3000/estudiantes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(estudiante)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al procesar la solicitud');
        }

        // Limpiar formulario (excepto el campo oculto) y recargar lista
        form.reset();
        // Limpiar manualmente el campo gmailCompleto
        document.getElementById('gmailCompleto').value = '';
        await cargarEstudiantes();

        // Mostrar mensaje de éxito
        mostrarMensaje(
            '✅ Estudiante agregado correctamente',
            'success'
        );

        // Desplazarse a la tabla
        document.querySelector('.table-responsive').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje(`❌ ${error.message || 'Ocurrió un error al procesar la solicitud'}`, 'danger');
    } finally {
        // Restaurar el botón
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

async function actualizarEstudiante(estudiante) {
    try {
        const response = await fetch(`http://localhost:3000/estudiantes/${estudiante.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(estudiante)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al actualizar el estudiante');
        }

        // Recargar la lista de estudiantes
        await cargarEstudiantes();

        // Mostrar mensaje de éxito
        mostrarMensaje('✅ Estudiante actualizado correctamente', 'success');

        return true;
    } catch (error) {
        console.error('Error al actualizar estudiante:', error);
        mostrarMensaje(`❌ ${error.message || 'Error al actualizar el estudiante'}`, 'danger');
        throw error;
    }
}

function abrirModalEdicion(estudiante) {
    modalEditar.show(estudiante);
}

function solicitarEliminacion(id) {
    estudianteIdActual = id;
    confirmarEliminarModal.show();
}

async function confirmarEliminacion() {
    if (!estudianteIdActual) return;

    try {
        const response = await fetch(`http://localhost:3000/estudiantes/${estudianteIdActual}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Error al eliminar el estudiante');
        }

        // Cerrar modal y recargar lista
        confirmarEliminarModal.hide();
        await cargarEstudiantes();

        mostrarMensaje('Estudiante eliminado correctamente', 'success');

    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al eliminar el estudiante', 'danger');
    } finally {
        estudianteIdActual = null;
    }
}

function mostrarMensaje(mensaje, tipo) {
    // Crear el contenedor de notificaciones si no existe
    let notificacionesContainer = document.getElementById('notificaciones-container');
    
    if (!notificacionesContainer) {
        notificacionesContainer = document.createElement('div');
        notificacionesContainer.id = 'notificaciones-container';
        document.body.appendChild(notificacionesContainer);
        
        // Agregar estilos al contenedor
        const style = document.createElement('style');
        style.textContent = `
            #notificaciones-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1100;
                max-width: 350px;
                width: 100%;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .notificacion {
                animation: slideIn 0.3s ease-out forwards;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                opacity: 0;
                transform: translateX(100%);
                background-color: #ffffff !important;
                color: #4a4a4a !important;
                border: 1px solid #e0e0e0;
                border-left: 4px solid #9c89b8;
                border-radius: 6px;
                padding: 12px 16px;
            }
            
            .notificacion .btn-close {
                opacity: 0.6;
                background-size: 0.8em;
            }
            
            .notificacion .btn-close:hover {
                opacity: 1;
            }
            
            .notificacion i {
                color: #9c89b8;
                font-size: 1.2em;
            }
            
            .notificacion.success {
                border-left-color: #28a745;
            }
            
            .notificacion.success i {
                color: #28a745;
            }
            
            .notificacion.danger {
                border-left-color: #dc3545;
            }
            
            .notificacion.danger i {
                color: #dc3545;
            }
            
            .notificacion.warning {
                border-left-color: #ffc107;
            }
            
            .notificacion.warning i {
                color: #ffc107;
            }
            
            @keyframes slideIn {
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            .notificacion.fade-out {
                animation: fadeOut 0.3s ease-out forwards;
            }
            
            @keyframes fadeOut {
                to {
                    opacity: 0;
                    transform: translateX(100%);
                    margin-bottom: -60px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Crear la notificación
    const notificacion = document.createElement('div');
    notificacion.className = `alert alert-${tipo} alert-dismissible fade show d-flex align-items-center notificacion`;
    notificacion.role = 'alert';
    
    // Determinar el ícono según el tipo de mensaje
    let icono = 'info-circle';
    if (tipo === 'success') icono = 'check-circle';
    else if (tipo === 'danger') icono = 'exclamation-triangle';
    else if (tipo === 'warning') icono = 'exclamation-circle';
    
    notificacion.innerHTML = `
        <i class="bi bi-${icono} me-2"></i>
        <div class="flex-grow-1">${mensaje}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
    `;
    
    // Agregar la notificación al contenedor
    notificacionesContainer.appendChild(notificacion);
    
    // Forzar el reflow para que la animación funcione
    notificacion.offsetHeight;
    notificacion.style.opacity = '1';
    notificacion.style.transform = 'translateX(0)';
    
    // Configurar el cierre de la notificación
    const botonCerrar = notificacion.querySelector('.btn-close');
    const cerrarNotificacion = () => {
        notificacion.classList.add('fade-out');
        setTimeout(() => {
            notificacion.remove();
            // Eliminar el contenedor si no hay más notificaciones
            if (notificacionesContainer.children.length === 0) {
                notificacionesContainer.remove();
            }
        }, 300);
    };
    
    botonCerrar.addEventListener('click', (e) => {
        e.preventDefault();
        cerrarNotificacion();
    });
    
    // Cerrar automáticamente después de 5 segundos
    const timeoutId = setTimeout(cerrarNotificacion, 5000);
    
    // Pausar el cierre automático al hacer hover
    notificacion.addEventListener('mouseenter', () => {
        clearTimeout(timeoutId);
    });
    
    // Reanudar el cierre automático al salir del hover
    notificacion.addEventListener('mouseleave', () => {
        setTimeout(cerrarNotificacion, 2000);
    });
}

function mostrarEstadoCarga(mostrar) {
    isLoading = mostrar;
    const loadingRow = document.getElementById('loadingRow');

    if (mostrar) {
        if (!loadingRow) {
            const row = document.createElement('tr');
            row.id = 'loadingRow';
            row.innerHTML = `
                <td colspan="7" class="text-center py-4">
                    <div class="d-flex justify-content-center align-items-center">
                        <div class="spinner-border text-primary me-3" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <span>Cargando estudiantes...</span>
                    </div>
                </td>
            `;
            estudiantesTableBody.appendChild(row);
        }
    } else if (loadingRow) {
        loadingRow.remove();
    }
}

// Función para generar un número de celular aleatorio que empiece con 7
function generarNumeroCelular() {
    // Generar 7 dígitos aleatorios
    const digitos = Array.from({length: 7}, () => Math.floor(Math.random() * 10)).join('');
    // Retornar el número que siempre empieza con 7
    return '7' + digitos;
}

// Manejador para el botón de generar celular
document.getElementById('generarCelular')?.addEventListener('click', () => {
    document.getElementById('celular').value = generarNumeroCelular();
});

// Función para abrir el modal de edición
function abrirModalEdicion(estudiante) {
    modalEditar.show(estudiante);
}

// Hacer las funciones accesibles globalmente
window.abrirModalEdicion = abrirModalEdicion;
window.solicitarEliminacion = solicitarEliminacion;
