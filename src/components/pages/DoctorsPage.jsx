export default function DoctorsPage() {
  const doctors = [
    { id: 1, name: 'Dr. Sarah Williams', specialty: 'Cardiology', email: 'sarah@powervate.com', patients: 45 },
    { id: 2, name: 'Dr. Michael Brown', specialty: 'Neurology', email: 'michael@powervate.com', patients: 32 },
    { id: 3, name: 'Dr. Emily Davis', specialty: 'Pediatrics', email: 'emily@powervate.com', patients: 58 }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Doctors Management</h3>
        <button className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition">
          Add New Doctor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {doctor.name.split(' ')[1][0]}
              </div>
              <div className="ml-4">
                <h4 className="font-semibold text-gray-800">{doctor.name}</h4>
                <p className="text-sm text-gray-600">{doctor.specialty}</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Email:</span> {doctor.email}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Patients:</span> {doctor.patients}
              </p>
            </div>
            <div className="flex space-x-2">
              <button className="flex-1 bg-blue-50 text-blue-900 py-2 rounded hover:bg-blue-100 transition text-sm">
                View Profile
              </button>
              <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 transition text-sm">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
