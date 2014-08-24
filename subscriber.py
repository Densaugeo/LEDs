import zmq

def i2c_command(pin, value):
  try:
    pin = int(pin)
    value = int(value)
  except ValueError:
    print("Pin or PWM value not a valid integer")
    return
  
  if (pin < 0 or pin > 15):
    print("Pin number out of range")
    return
  if (value < 0 or value > 4095):
    print("PWM value out of range")
    return
  print("Set pin %s to %s" % (pin, value))

# Prepare our context and publisher
context = zmq.Context()
subscriber = context.socket(zmq.SUB)
subscriber.connect("tcp://localhost:5565")
subscriber.setsockopt(zmq.SUBSCRIBE, b"")

while True:
  try:
    # Read envelope with address
    (pin, value) = subscriber.recv_multipart()
    i2c_command(pin, value)
  except Error:
    print("There was an error! I would tell you more if I knew Python better")

# We never get here but clean up anyhow
subscriber.close()
context.term()
