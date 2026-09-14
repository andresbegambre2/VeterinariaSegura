const initialState = {
  propietarios: [
    { id: 1, nombre: "Ana Gomez", documento: "1001001", telefono: "3001234567", correo: "ana@example.com" }
  ],
  mascotas: [
    { id: 1, nombre: "Luna", especie: "perro", raza: "Labrador", edad: 4, propietarioId: 1 }
  ],
  veterinarios: [
    { id: 1, nombre: "Carlos Ruiz", documento: "2002002", especialidad: "Medicina general", telefono: "3011234567", correo: "carlos@vet.example" }
  ],
  citas: [
    { id: 1, fecha: "2026-10-01", hora: "09:00", motivo: "Control general", estado: "programada", mascotaId: 1, veterinarioId: 1 }
  ]
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const store = clone(initialState);

function resetStore() {
  for (const key of Object.keys(initialState)) store[key] = clone(initialState[key]);
}

module.exports = { store, resetStore };
