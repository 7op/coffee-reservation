import { useState } from "react";

// البيانات الوهمية للحجوزات المتاحة
const availableReservations = [
  { id: 1, date: "2025-03-10", time: "10:00", maxGuests: 4, bookingType: "table" },
  { id: 2, date: "2025-03-10", time: "12:00", maxGuests: 2, bookingType: "specific-place" },
];

interface Reservation {
    id: number;
    date: string;
    time: string;
    maxGuests: number;
    bookingType: string;
  }
  
const Booking = () => {
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [userData, setUserData] = useState({
    name: "",
    phone: "",
    email: "",
    guests: 1,
  });

  const handleSelectReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("تم الحجز بنجاح! 🎉");
    console.log("بيانات الحجز:", { ...userData, reservation: selectedReservation });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
      {!selectedReservation ? (
        <>
          <h1 className="text-4xl font-bold mb-8 text-white">اختر حجزك</h1>
          <div className="w-full">
            {availableReservations.length === 0 ? (
              <p className="text-gray-200">لا توجد حجوزات حالياً.</p>
            ) : (
              <ul className="space-y-6">
                {availableReservations.map((reservation) => (
                  <li
                    key={reservation.id}
                    className="border p-6 rounded-lg shadow-lg cursor-pointer hover:bg-blue-200 transition-all duration-300 ease-in-out"
                    onClick={() => handleSelectReservation(reservation)}
                  >
                    <p className="text-xl font-semibold text-gray-800">
                      <strong className="text-blue-700">التاريخ:</strong> {reservation.date} 
                    </p>
                    <p className="text-gray-600">
                      <strong className="text-blue-700">الوقت:</strong> {reservation.time} <br />
                      <strong className="text-blue-700">عدد الأشخاص:</strong> {reservation.maxGuests} <br />
                      <strong className="text-blue-700">نوع الحجز:</strong> {reservation.bookingType}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : (
        <>
          <h1 className="text-4xl font-bold mb-8 text-white">إدخال بيانات الحجز</h1>
          <form onSubmit={handleSubmit} className="bg-white p-8 shadow-xl rounded-md w-96">
            <label className="block mb-3 font-semibold">الاسم</label>
            <input
              type="text"
              name="name"
              value={userData.name}
              onChange={handleChange}
              className="border-2 border-gray-300 p-3 w-full rounded-md mb-5 focus:outline-none focus:border-blue-500"
              placeholder="أدخل اسمك"
            />
            <label className="block mb-3 font-semibold">رقم الجوال</label>
            <input
              type="tel"
              name="phone"
              value={userData.phone}
              onChange={handleChange}
              className="border-2 border-gray-300 p-3 w-full rounded-md mb-5 focus:outline-none focus:border-blue-500"
              placeholder="أدخل رقم الجوال"
            />
            <label className="block mb-3 font-semibold">البريد الإلكتروني</label>
            <input
              type="email"
              name="email"
              value={userData.email}
              onChange={handleChange}
              className="border-2 border-gray-300 p-3 w-full rounded-md mb-5 focus:outline-none focus:border-blue-500"
              placeholder="أدخل بريدك الإلكتروني"
            />
            <label className="block mb-3 font-semibold">عدد الأشخاص</label>
            <input
              type="number"
              name="guests"
              value={userData.guests}
              onChange={handleChange}
              className="border-2 border-gray-300 p-3 w-full rounded-md mb-5 focus:outline-none focus:border-blue-500"
              placeholder="عدد الأشخاص"
            />
            <button
              type="submit"
              className="mt-6 bg-blue-600 text-white p-3 rounded-md w-full hover:bg-blue-700 transition-all duration-300"
            >
              تأكيد الحجز
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default Booking;
