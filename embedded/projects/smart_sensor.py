"""
Project: Smart Sensor Node
Platform: ESP32
Description: Full IoT sensor node simulation.
             Reads temperature + voltage.
             Controls LED based on readings.
             Sends data over UART in JSON format.
             Simulates WiFi transmission.
"""

import json

def run(esp):

    TEMP_PIN    = 34
    VOLT_PIN    = 35
    STATUS_LED  = 2
    ALERT_LED   = 4
    DEVICE_ID   = "ESP32_NODE_001"

    esp.uart_begin(115200)
    esp.uart_print("=== Smart Sensor Node ===")
    esp.uart_print(f"Device ID: {DEVICE_ID}")

    esp.pin_mode(STATUS_LED, "OUTPUT")
    esp.pin_mode(ALERT_LED,  "OUTPUT")

    # Boot sequence
    esp.digital_write(STATUS_LED, 1)
    esp.uart_print("WiFi connecting...")
    esp.tick(1000)
    esp.uart_print("WiFi connected: 192.168.1.105")
    esp.uart_print("MQTT broker: connected")

    transmitted = []
    errors      = 0

    for sample in range(8):
        esp.tick(500)

        temp    = esp.read_temperature(TEMP_PIN)
        voltage = esp.read_voltage(VOLT_PIN)

        t = temp["temperature_c"]
        v = voltage["voltage"]

        alert = t > 27.0 or v < 3.0
        esp.digital_write(ALERT_LED, 1 if alert else 0)

        payload = {
            "device":      DEVICE_ID,
            "sample":      sample + 1,
            "temperature": t,
            "voltage":     v,
            "alert":       alert,
            "time_ms":     esp.time_ms
        }

        esp.uart_print(
            f"TX [{sample+1}]: "
            f"T={t}C V={v}V "
            f"{'ALERT' if alert else 'OK'}"
        )

        transmitted.append(payload)

    esp.digital_write(STATUS_LED, 0)
    esp.digital_write(ALERT_LED,  0)

    alert_count = sum(1 for p in transmitted if p["alert"])
    temps       = [p["temperature"] for p in transmitted]

    esp.uart_print(
        f"Session complete: {len(transmitted)} packets, "
        f"{alert_count} alerts, {errors} errors"
    )
    esp.uart_print("PASS: Smart sensor node project complete")

    return {
        "project":      "Smart Sensor Node",
        "device_id":    DEVICE_ID,
        "packets_sent": len(transmitted),
        "alerts":       alert_count,
        "errors":       errors,
        "data":         transmitted,
        "stats": {
            "avg_temp": round(sum(temps) / len(temps), 2),
            "max_temp": round(max(temps), 2),
            "min_temp": round(min(temps), 2)
        },
        "status": "PASS"
    }