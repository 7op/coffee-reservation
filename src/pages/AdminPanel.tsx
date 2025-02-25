import { useState } from "react";

type Reservation = {
  id: number;
  date: string;
  time: string;
  maxGuests: number;
  bookingType: string;
};

const AdminPanel = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [maxGuests, setMaxGuests] = useState(1);
  const [bookingType, setBookingType] = useState("table");

  const handleCreateReservation = () => {
    const newReservation: Reservation = {
      id: reservations.length + 1,
      date,
      time,
      maxGuests,
      bookingType,
    };
    setReservations([...reservations, newReservation]);
    // Reset form
    setDate("");
    setTime("");
    setMaxGuests(1);
    setBookingType("table");
    alert("تم إضافة الحجز بنجاح!");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">لوحة تحكم المسؤول</h1>

      {/* نموذج إضافة حجز جديد */}
      <div className="bg-white p-6 shadow-md rounded-md w-80 mb-6">
        <h2 className="text-2xl font-semibold mb-4">إضافة حجز جديد</h2>
        <label className="block mb-2 font-semibold">التاريخ</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border p-2 w-full rounded-md mb-2"
        />

        <label className="block mb-2 font-semibold">الوقت</label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="border p-2 w-full rounded-md mb-2"
        />

        <label className="block mb-2 font-semibold">عدد الأشخاص</label>
        <input
          type="number"
          value={maxGuests}
          onChange={(e) => setMaxGuests(Number(e.target.value))}
          className="border p-2 w-full rounded-md mb-2"
        />

        <label className="block mb-2 font-semibold">نوع الحجز</label>
        <select
          value={bookingType}
          onChange={(e) => setBookingType(e.target.value)}
          className="border p-2 w-full rounded-md mb-2"
        >
          <option value="table">طاولة</option>
          <option value="specific-place">مكان محدد</option>
          <option value="any">غير محدد</option>
        </select>

        <button
          onClick={handleCreateReservation}
          className="mt-4 bg-blue-500 text-white p-2 rounded-md w-full hover:bg-blue-600"
        >
          إضافة الحجز
        </button>
      </div>

      {/* عرض الحجوزات للمستخدمين */}
      <div className="w-full">
        <h2 className="text-2xl font-semibold mb-4">الحجوزات المتاحة</h2>
        {reservations.length === 0 ? (
          <p>لا توجد حجوزات حالياً.</p>
        ) : (
          <ul>
            {reservations.map((reservation) => (
              <li key={reservation.id} className="border p-2 mb-2">
                <p>
                  <strong>التاريخ:</strong> {reservation.date}{" "}
                  <strong>الوقت:</strong> {reservation.time}{" "}
                  <strong>عدد الأشخاص:</strong> {reservation.maxGuests}{" "}
                  <strong>نوع الحجز:</strong> {reservation.bookingType}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
