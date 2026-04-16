import { useEffect, useState } from "react";
import { getTestApi } from "../api/testApi";

function HomePage() {
  const [message, setMessage] = useState("Đang tải dữ liệu...");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTestApi = async () => {
      try {
        const data = await getTestApi();
        setMessage(data.message);
      } catch (err) {
        setError("Không gọi được API từ backend");
        console.error(err);
      }
    };

    fetchTestApi();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      {error ? <p>{error}</p> : <p>Phản hồi từ backend: {message}</p>}
    </div>
  );
}

export default HomePage;
