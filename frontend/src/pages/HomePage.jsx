function HomePage() {
  return (
    <main className="min-h-[calc(100vh-48px)] overflow-hidden rounded-2xl bg-slate-950 shadow">
      <section
        className="relative flex min-h-[calc(100vh-48px)] items-center bg-cover bg-center px-8 py-12 text-white"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(2, 6, 23, 0.78), rgba(2, 6, 23, 0.22)), url('/datamining_background_4k.svg')",
        }}
      >
        <div className="relative z-10 max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200"></p>
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">
            Khai thác dữ liệu
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-100 md:text-lg">
            Chọn thuật toán ở thanh bên để tiền xử lý dữ liệu, phân lớp, gom
            cụm, ...
          </p>
        </div>
      </section>
    </main>
  );
}

export default HomePage;
