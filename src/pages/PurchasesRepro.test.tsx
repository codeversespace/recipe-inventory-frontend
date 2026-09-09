import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, createTheme } from "@mui/material/styles";

jest.mock("../api/client", () => {
  const purchases = [
    { id: 1, supplier_id: 1, supplier_name: "Noor Dry Fruit Co.", category: "raw_material", item_name: "Almonds", unit: "kg", quantity: 40, unit_price: 720, total_amount: 28800, purchased_at: "2026-06-12T11:00:00", reference: "PUR-2026-0002" },
    { id: 2, supplier_id: 2, supplier_name: "Fresh Harvest Traders", category: "raw_material", item_name: "Medjool Dates", unit: "kg", quantity: 80, unit_price: 310, total_amount: 24800, purchased_at: "2026-06-10T10:00:00", reference: "PUR-2026-0001" },
  ];
  return {
    api: {
      get: async (url: string) => {
        if (url === "/suppliers/purchases/all") return { data: purchases };
        return { data: [] };
      },
      post: async () => ({ data: {} }),
      put: async () => ({}),
      delete: async () => ({}),
    },
  };
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Purchases } = require("./Purchases");

const ROWS = [
  { id: 1, supplier_id: 1, supplier_name: "Noor Dry Fruit Co.", category: "raw_material", item_name: "Almonds", unit: "kg", quantity: 40, unit_price: 720, total_amount: 28800, purchased_at: "2026-06-12T11:00:00", reference: "PUR-2026-0002" },
  { id: 2, supplier_id: 2, supplier_name: "Fresh Harvest Traders", category: "raw_material", item_name: "Medjool Dates", unit: "kg", quantity: 80, unit_price: 310, total_amount: 24800, purchased_at: "2026-06-10T10:00:00", reference: "PUR-2026-0001" },
];

test("desktop purchases table renders rows without crashing", async () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const theme = createTheme();
  render(
    <QueryClientProvider client={qc}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={["/purchases"]}>
          <Purchases />
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
  expect(await screen.findByText("Almonds", {}, { timeout: 10000 })).toBeInTheDocument();
  expect(screen.getByText("Medjool Dates")).toBeInTheDocument();
});
