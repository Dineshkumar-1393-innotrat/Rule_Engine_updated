// export const LANGUAGE_VERSIONS = {
//     C11: "(ISO/IEC 9899:2011)",
//     C17: "(ISO/IEC 9899:2018)",
//    C18:"(ISO/IEC 9899:2018)"
// }


// export const CODE_SNIPPETS = {
// C: `#include <stdio.h>\n\nint main() {\n\tprintf("Hello, InnoPioneers!\\n");\n\treturn 0;\n}\n`,
// C11: `#include <stdio.h>\n\nint main() {\n\tprintf("Hello, InnoPioneers!\\n");\n\treturn 0;\n}\n`,
// C17: `#include <stdio.h>\n\nint main() {\n\tprintf("Hello, InnoPioneers!\\n");\n\treturn 0;\n}\n`,
// C18: `#include <stdio.h>\n\nint main() {\n\tprintf("Hello, InnoPioneers!\\n");\n\treturn 0;\n}\n`

// }

export const LANGUAGE_VERSIONS = {
  javascript: "18.15.0",
  typescript: "5.0.3",
  python: "3.10.0",
  java: "15.0.2",
  csharp: "6.12.0",
  php: "8.2.3",
  c: "10.2.0",
  arduino: "10.2.0",  // Arduino uses GCC, same as C
  esp32: "10.2.0",    // ESP32 uses GCC, same as C
};

// Map custom language names to Monaco Editor language IDs
export const MONACO_LANGUAGE_MAP = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
  csharp: "csharp",
  php: "php",
  c: "c",
  arduino: "cpp", // Arduino uses C++ syntax
  esp32: "cpp",   // ESP32 uses C++ syntax
};

export const CODE_SNIPPETS = {
  javascript: `\nfunction greet(name) {\n\tconsole.log("Hello, " + name + "!");\n}\n\ngreet("Alex");\n`,
  typescript: `\ntype Params = {\n\tname: string;\n}\n\nfunction greet(data: Params) {\n\tconsole.log("Hello, " + data.name + "!");\n}\n\ngreet({ name: "Alex" });\n`,
  python: `\ndef greet(name):\n\tprint("Hello, " + name + "!")\n\ngreet("Alex")\n`,
  java: `\npublic class HelloWorld {\n\tpublic static void main(String[] args) {\n\t\tSystem.out.println("Hello World");\n\t}\n}\n`,
  csharp:
    'using System;\n\nnamespace HelloWorld\n{\n\tclass Hello { \n\t\tstatic void Main(string[] args) {\n\t\t\tConsole.WriteLine("Hello World in C#");\n\t\t}\n\t}\n}\n',
  php: "<?php\n\n$name = 'Alex';\necho $name;\n",
  // c: `#include <stdio.h>\n\nint main() {\n\tprintf("Hello, World!\\n");\n\treturn 0;\n}\n`, 
  c: `#include <stdio.h>\n\nint sum(int a, int b) {\n\treturn a + b;\n}\n\nint main() {\n\tprintf("%d", sum(3, 4));\n\treturn 0;\n}\n`,
  arduino: `#include <Arduino.h>\n\n// LED Blink Example for Arduino\n// Define the LED pin (built-in LED on most Arduino boards is pin 13)\nconst int ledPin = 13;\n\nvoid setup() {\n\t// Initialize the digital pin as an output\n\tpinMode(ledPin, OUTPUT);\n}\n\nvoid loop() {\n\tdigitalWrite(ledPin, HIGH);   // Turn the LED on\n\tdelay(1000);                  // Wait for 1 second\n\tdigitalWrite(ledPin, LOW);    // Turn the LED off\n\tdelay(1000);                  // Wait for 1 second\n}\n`,
  esp32: `#include <Arduino.h>\n\n// LED Blink Example for ESP32\n// Define the LED pin (built-in LED on most ESP32 boards is GPIO 2)\nconst int ledPin = 2;\n\nvoid setup() {\n\t// Initialize the digital pin as an output\n\tpinMode(ledPin, OUTPUT);\n\tSerial.begin(115200);\n\tSerial.println("ESP32 LED Blink Started");\n}\n\nvoid loop() {\n\tdigitalWrite(ledPin, HIGH);   // Turn the LED on\n\tSerial.println("LED ON");\n\tdelay(1000);                  // Wait for 1 second\n\tdigitalWrite(ledPin, LOW);    // Turn the LED off\n\tSerial.println("LED OFF");\n\tdelay(1000);                  // Wait for 1 second\n}\n`,
};




