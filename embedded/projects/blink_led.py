"""
Project: LED Blink
Platform: ESP32
Description: Blinks an LED on GPIO2 with configurable timing.
             Reads a button on GPIO0 to pause blinking.
"""

def run(esp):

    LED_PIN    = 2
    BUTTON_PIN = 0
    BLINK_MS   = 500

    esp.uart_begin(115200)
    esp.uart_print("=== LED Blink Project ===")
    esp.uart_print(f"LED: GPIO{LED_PIN}  Button: GPIO{BUTTON_PIN}")

    esp.pin_mode(LED_PIN,    "OUTPUT")
    esp.pin_mode(BUTTON_PIN, "INPUT")

    results = []

    for cycle in range(6):
        esp.tick(10)

        button = esp.digital_read(BUTTON_PIN)

        if button:
            esp.uart_print(f"Cycle {cycle+1}: Button pressed — pause")
            esp.tick(BLINK_MS)
            continue

        esp.digital_write(LED_PIN, 1)
        esp.uart_print(f"Cycle {cycle+1}: LED ON")
        results.append({
            "cycle": cycle + 1,
            "state": "ON",
            "time_ms": esp.time_ms
        })

        esp.tick(BLINK_MS)

        esp.digital_write(LED_PIN, 0)
        esp.uart_print(f"Cycle {cycle+1}: LED OFF")
        results.append({
            "cycle": cycle + 1,
            "state": "OFF",
            "time_ms": esp.time_ms
        })

        esp.tick(BLINK_MS)

    esp.uart_print("PASS: LED blink project complete")

    return {
        "project":  "LED Blink",
        "gpio_pin": LED_PIN,
        "cycles":   6,
        "results":  results,
        "status":   "PASS"
    }