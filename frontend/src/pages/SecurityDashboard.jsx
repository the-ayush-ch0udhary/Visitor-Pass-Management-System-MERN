import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Html5QrcodeScanner } from "html5-qrcode";

const SecurityDashboard = () => {
  const [passIdInput, setPassIdInput] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const scannerRef = useRef(null);
  const [showScanner, setShowScanner] = useState(false);

  const fetchLogs = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const headers = { Authorization: `Bearer ${user.token}` };
      const res = await axios.get("http://localhost:5000/api/check-logs", {
        headers,
      });
      setLogs(res.data);
    } catch (err) {
      setError("Failed to fetch check logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!showScanner) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      false,
    );

    scanner.render(
      (decodedText) => {
        try {
          // If QR contains JSON
          const parsed = JSON.parse(decodedText);

          if (parsed.passId) {
            setPassIdInput(parsed.passId);
          } else {
            setPassIdInput(decodedText);
          }
        } catch {
          // If QR contains plain text
          setPassIdInput(decodedText);
        }

        setActionMessage("QR Code scanned successfully!");
        setShowScanner(false);

        scanner.clear().catch(() => {});
      },
      () => {
        // Ignore scan errors
      },
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [showScanner]);

  const handleScanAction = async (action) => {
    setActionMessage("");
    setActionError("");
    if (!passIdInput.trim()) {
      setActionError("Please enter a Pass ID or scan a QR code first.");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const headers = { Authorization: `Bearer ${user.token}` };
      const endpoint = `http://localhost:5000/api/check-logs/${action}`;

      const res = await axios.post(
        endpoint,
        { passId: passIdInput.trim() },
        { headers },
      );

      setActionMessage(res.data.message);
      setPassIdInput("");
      fetchLogs(); // refresh log table
    } catch (err) {
      setActionError(err.response?.data?.message || "Transaction failed.");
    }
  };

  if (loading)
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Loading Security terminal...
      </div>
    );
  if (error)
    return (
      <div style={{ padding: "40px", color: "var(--danger)" }}>{error}</div>
    );

  return (
    <div className="dashboard-layout animated-fade-in">
      {/* Sidebar panel */}
      <aside className="sidebar">
        <h3
          style={{
            fontSize: "14px",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginBottom: "15px",
          }}
        >
          Navigation
        </h3>
        <Link to="/security" className="sidebar-link active">
          Scan Console
        </Link>
        <Link to="/visitors-list" className="sidebar-link">
          Visitor Profiles
        </Link>
        <Link to="/reports" className="sidebar-link">
          Reports
        </Link>
      </aside>

      {/* Main dashboard center */}
      <main className="main-content">
        <h2 style={{ fontSize: "32px", marginBottom: "8px" }}>
          Front-Desk Security Console
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "30px" }}>
          Verify digital QR codes to check-in or check-out visitors.
        </p>

        {/* Scan controller panels */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "30px",
            marginBottom: "30px",
          }}
        >
          <div className="glass-panel" style={{ padding: "30px" }}>
            <h3 style={{ fontSize: "18px", marginBottom: "15px" }}>
              QR Code & ID Scan Port
            </h3>

            {actionMessage && (
              <div
                style={{
                  background: "var(--success-bg)",
                  border: "1px solid var(--success)",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  color: "var(--success)",
                  fontSize: "13px",
                  marginBottom: "15px",
                }}
              >
                ✅ {actionMessage}
              </div>
            )}
            {actionError && (
              <div
                style={{
                  background: "var(--danger-bg)",
                  border: "1px solid var(--danger)",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  color: "var(--danger)",
                  fontSize: "13px",
                  marginBottom: "15px",
                }}
              >
                ⚠️ {actionError}
              </div>
            )}

            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
              <input
                type="text"
                className="form-control"
                placeholder="Paste Pass ID or QR code text here"
                value={passIdInput}
                onChange={(e) => setPassIdInput(e.target.value)}
                style={{ flex: 1, minWidth: "250px" }}
              />

              <button
                className="btn btn-primary"
                onClick={() => setShowScanner(!showScanner)}
                style={{ padding: "12px 24px" }}
              >
                {showScanner ? "Close Scanner" : "📷 Scan QR"}
              </button>

              <button
                className="btn btn-success"
                onClick={() => handleScanAction("check-in")}
                style={{ padding: "12px 24px" }}
              >
                Check In
              </button>

              <button
                className="btn btn-danger"
                onClick={() => handleScanAction("check-out")}
                style={{ padding: "12px 24px" }}
              >
                Check Out
              </button>
            </div>

            {showScanner && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "20px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <h4 style={{ marginBottom: "15px" }}>Scan Visitor QR Code</h4>

                <div
                  id="qr-reader"
                  style={{
                    width: "100%",
                    maxWidth: "500px",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Entry Logs Table */}
        <div className="glass-panel" style={{ padding: "30px" }}>
          <h3 style={{ fontSize: "18px", marginBottom: "15px" }}>
            On-Site Guest Logs
          </h3>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Pass ID</th>
                  <th>Visitor Name</th>
                  <th>Host Employee</th>
                  <th>Check-In Time</th>
                  <th>Check-Out Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        textAlign: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      No visitor entry logs recorded.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id}>
                      <td
                        style={{
                          fontSize: "12px",
                          fontFamily: "monospace",
                          color: "var(--text-muted)",
                        }}
                      >
                        {log.passId?._id}
                      </td>
                      <td style={{ fontWeight: "600" }}>
                        {log.visitorId?.name}
                      </td>
                      <td>
                        {log.passId?.appointmentId?.hostId?.name || "N/A"}
                      </td>
                      <td>
                        {log.checkInTime
                          ? new Date(log.checkInTime).toLocaleString()
                          : "N/A"}
                      </td>
                      <td>
                        {log.checkOutTime
                          ? new Date(log.checkOutTime).toLocaleString()
                          : "-"}
                      </td>
                      <td>
                        {log.checkOutTime ? (
                          <span className="status-pill status-rejected">
                            Checked Out
                          </span>
                        ) : (
                          <span className="status-pill status-approved">
                            Checked In (Active)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SecurityDashboard;
