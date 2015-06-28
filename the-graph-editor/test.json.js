loadGraph(
{
  "processes": {
    "getTimezoneOffset": {
    },
    "makeTimezoneAngle": {
    },
    "fixHourAngle": {
    },
    "makeHourRotation": {
    },
    "rotateMinuteHand": {
    },
    "rotateHourHand": {
    },
    "getSecondHand": {
    },
    "getMinuteHand": {
    },
    "getHourHand": {
    },
    "makeSecondRotation": {
    },
    "rotateSecondHand": {
    },
    "split": {
    },
    "animationFrame": {
    },
    "createDate": {
    },
    "makeMinuteRotation": {
    },
    "core/Kick_qr1da": {
      "component": "core/Kick"
    }
  },
  "connections": [
    {
      "src": {
        "process": "createDate",
        "port": "out"
      },
      "tgt": {
        "process": "split",
        "port": "in"
      }
    },
    {
      "src": {
        "process": "split",
        "port": "out"
      },
      "tgt": {
        "process": "makeSecondRotation",
        "port": "dividend"
      }
    },
    {
      "src": {
        "process": "getSecondHand",
        "port": "element"
      },
      "tgt": {
        "process": "rotateSecondHand",
        "port": "element"
      }
    },
    {
      "src": {
        "process": "makeSecondRotation",
        "port": "quotient"
      },
      "tgt": {
        "process": "rotateSecondHand",
        "port": "percent"
      }
    },
    {
      "src": {
        "process": "split",
        "port": "out"
      },
      "tgt": {
        "process": "makeMinuteRotation",
        "port": "dividend"
      }
    },
    {
      "src": {
        "process": "split",
        "port": "out"
      },
      "tgt": {
        "process": "makeHourRotation",
        "port": "dividend"
      }
    },
    {
      "src": {
        "process": "getMinuteHand",
        "port": "element"
      },
      "tgt": {
        "process": "rotateMinuteHand",
        "port": "element"
      }
    },
    {
      "src": {
        "process": "makeMinuteRotation",
        "port": "quotient"
      },
      "tgt": {
        "process": "rotateMinuteHand",
        "port": "percent"
      }
    },
    {
      "src": {
        "process": "getHourHand",
        "port": "element"
      },
      "tgt": {
        "process": "rotateHourHand",
        "port": "element"
      }
    },
    {
      "src": {
        "process": "animationFrame",
        "port": "out"
      },
      "tgt": {
        "process": "createDate",
        "port": "in"
      }
    },
    {
      "src": {
        "process": "split",
        "port": "out"
      },
      "tgt": {
        "process": "getTimezoneOffset",
        "port": "in"
      }
    },
    {
      "src": {
        "process": "getTimezoneOffset",
        "port": "out"
      },
      "tgt": {
        "process": "makeTimezoneAngle",
        "port": "dividend"
      }
    },
    {
      "src": {
        "process": "makeHourRotation",
        "port": "quotient"
      },
      "tgt": {
        "process": "fixHourAngle",
        "port": "augend"
      }
    },
    {
      "src": {
        "process": "makeTimezoneAngle",
        "port": "quotient"
      },
      "tgt": {
        "process": "fixHourAngle",
        "port": "addend"
      }
    },
    {
      "src": {
        "process": "fixHourAngle",
        "port": "sum"
      },
      "tgt": {
        "process": "rotateHourHand",
        "port": "percent"
      }
    },
    {
      "src": {
        "process": "core/Kick_qr1da",
        "port": "out"
      },
      "tgt": {
        "process": "animationFrame",
        "port": "start"
      }
    },
    {
      "data": "#hours",
      "tgt": {
        "process": "getHourHand",
        "port": "selector"
      }
    },
    {
      "data": "#minutes",
      "tgt": {
        "process": "getMinuteHand",
        "port": "selector"
      }
    },
    {
      "data": "#seconds",
      "tgt": {
        "process": "getSecondHand",
        "port": "selector"
      }
    },
    {
      "data": 60000,
      "tgt": {
        "process": "makeSecondRotation",
        "port": "divisor"
      }
    },
    {
      "data": 3600000,
      "tgt": {
        "process": "makeMinuteRotation",
        "port": "divisor"
      }
    },
    {
      "data": "getTimezoneOffset",
      "tgt": {
        "process": "getTimezoneOffset",
        "port": "method"
      }
    },
    {
      "data": "43200000",
      "tgt": {
        "process": "makeHourRotation",
        "port": "divisor"
      }
    },
    {
      "data": "-720",
      "tgt": {
        "process": "makeTimezoneAngle",
        "port": "divisor"
      }
    },
    {
      "data": "start",
      "tgt": {
        "process": "core/Kick_qr1da",
        "port": "in"
      }
    },
    {
      "data": true,
      "tgt": {
        "process": "core/Kick_qr1da",
        "port": "data"
      }
    }
  ]
}
);