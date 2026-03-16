"""
Project: Temperature Monitor
Platform: ESP32
Description: Reads temperature every second.
             Triggers an alert LED if temp exceeds threshold.
             Sends data over UART.
"""

def run(esp):

    TEMP_PIN   = 34
    ALERT_PIN  = 2
    THRESHOLD  = 27.0

    esp.uart_begin(115200)
    esp.uart_print("=== Temperature Monitor ===")
    esp.uart_print(f"Sensor: GPIO{TEMP_PIN}  Alert LED: GPIO{ALERT_PIN}")
    esp.uart_print(f"Threshold: {THRESHOLD}C")

    esp.pin_mode(ALERT_PIN, "OUTPUT")
    esp.digital_write(ALERT_PIN, 0)

    readings  = []
    alerts    = 0

    for i in range(10):
        esp.tick(1000)

        temp = esp.read_temperature(TEMP_PIN)
        t    = temp["temperature_c"]

        alert = t > THRESHOLD
        esp.digital_write(ALERT_PIN, 1 if alert else 0)

        if alert:
            alerts += 1
            esp.uart_print(
                f"[{i+1}] ALERT! Temp={t}C > {THRESHOLD}C"
            )
        else:
            esp.uart_print(
                f"[{i+1}] Temp={t}C OK"
            )

        readings.append({
            "sample":      i + 1,
            "time_ms":     esp.time_ms,
            "temperature": t,
            "alert":       alert
        })

    temps    = [r["temperature"] for r in readings]
    avg_temp = round(sum(temps) / len(temps), 2)
    max_temp = round(max(temps), 2)
    min_temp = round(min(temps), 2)

    esp.uart_print(
        f"Stats: avg={avg_temp}C  "
        f"min={min_temp}C  max={max_temp}C  "
        f"alerts={alerts}"
    )
    esp.uart_print("PASS: Temperature monitor complete")

    return {
        "project":   "Temperature Monitor",
        "readings":  readings,
        "alerts":    alerts,
        "threshold": THRESHOLD,
        "stats": {
            "avg": avg_temp,
            "min": min_temp,
            "max": max_temp
        },
        "status": "PASS"
    }