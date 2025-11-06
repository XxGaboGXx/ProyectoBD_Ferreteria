// src/modules/Categoria/Types/Categoria.ts
export interface Categoria {
  Id_categoria: number;
  Nombre: string;
  Descripcion: string | null;
}

export interface CategoriaListResponse {
  data: Categoria[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface CategoriaEstadisticas {
  CategoriaNombre: string;
  Descripcion: string | null;
  TotalProductos: number;
  StockTotal: number;
  ProductosStockBajo: number;
  ProductosSinStock: number;
  PrecioMinimo: number;
  PrecioMaximo: number;
  PrecioPromedio: number;
  ValorInventarioCompra: number;
  ValorInventarioVenta: number;
}
