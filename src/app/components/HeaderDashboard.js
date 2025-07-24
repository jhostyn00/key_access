export default function HeaderDashboard() {
  return (
    <div className="bg-transparent p-4 flex justify-between text-black">
      <div id="dashboard-1" className="flex gap-16 w-1/3">
        <h1 className="text-2xl font-bold  ">Inicio</h1>
        <h1 className="text-2xl font-bold">Datos</h1>
        <h1 className="text-2xl font-bold ">Estadísticas</h1>
      </div>
      <div id="dashboard-2" className="w-1/3">
        <h1 className="text-2xl font-bold ">Logo</h1>
      </div>
      <div id="dashboard-3">
        <h1  className="text-2xl font-bold w-1/3">Usuario</h1>
      </div>
    </div>
  )
}
