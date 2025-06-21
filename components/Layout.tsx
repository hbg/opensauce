import React, { ReactNode } from "react";
import Header from "./Header";
import ShareButtons from "./ShareButtons";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box, useTheme } from "@mui/material";

const themeDark = createTheme({
  typography: {
    fontFamily: "'Funnel Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  components: {
    MuiInputBase: {
      styleOverrides: {
        input: {
          fontFamily: "'Funnel Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: "'Funnel Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        }
      }
    }
  },
  palette: {
    mode: "dark", // important for consistent dark styling
    background: {
      default: "transparent"
    },
    text: {
      primary: "#ffffff"
    },
    primary: {
      main: "#f1f1f1"
    }
  }
});

type Props = {
  children: ReactNode;
};

const Layout: React.FC<Props> = (props) => (
  <ThemeProvider theme={themeDark}>
    <CssBaseline /> {/* This sets default background + text styles */}
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary"
      }}
    >
      <Header />
      <ShareButtons />
      <div className="layout">{props.children}</div>
    </Box>
  </ThemeProvider>
);

export default Layout;
