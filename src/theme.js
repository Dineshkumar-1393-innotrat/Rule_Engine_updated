import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  breakpoints: {
    sm: "320px",
    md: "768px",
    lg: "960px",
    xl: "1200px",
    "2xl": "1536px",
  },
  styles: {
    global: {
      body: {
        bg: "gray.50",
        color: "gray.800",
        fontSize: { base: "sm", md: "md" },
      },
    },
  },
  components: {
    Container: {
      baseStyle: {
        maxW: "container.xl",
        px: { base: 4, md: 6 },
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: "800",
        letterSpacing: "-0.02em",
      },
    },
  },
});
export default theme;

