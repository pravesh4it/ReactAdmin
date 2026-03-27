import { Card, Typography, Button, Box } from "@mui/material";
import { useEffect, useState, useRef } from "react";

const InstructionScreen = ({ instruction, onContinue }) => {

  const [timeLeft, setTimeLeft] = useState(10);
  const continuedRef = useRef(false);

  useEffect(() => {

    const interval = setInterval(() => {

      setTimeLeft((prev) => {

        if (prev <= 1) {

          clearInterval(interval);

          if (!continuedRef.current) {
            continuedRef.current = true;
            onContinue();
          }

          return 0;
        }

        return prev - 1;

      });

    }, 1000);

    return () => clearInterval(interval);

  }, [onContinue]);



  const handleContinue = () => {

    if (!continuedRef.current) {
      continuedRef.current = true;
      onContinue();
    }

  };



  return (
    <Box height="100vh" display="flex" justifyContent="center" alignItems="center">

      <Card sx={{ p: 5, maxWidth: 600, textAlign: "center" }}>

        <Typography variant="h5" fontWeight="bold" mb={2}>
          Instructions
        </Typography>

        <Typography mb={3}>
          {instruction}
        </Typography>

        <Typography color="text.secondary" mb={4}>
          Survey will start automatically in <b>{timeLeft}</b> seconds
        </Typography>

        <Button variant="contained" onClick={handleContinue}>
          Start Now
        </Button>

      </Card>

    </Box>
  );
};

export default InstructionScreen;