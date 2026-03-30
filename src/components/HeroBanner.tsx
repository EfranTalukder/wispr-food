export default function HeroBanner() {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary to-pink-500 text-white p-6 sm:p-10">
      <div className="relative z-10 max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Hungry? We got you.
        </h1>
        <p className="text-sm sm:text-base text-white/90 mb-4">
          Order from the best restaurants in Dhaka. Fast delivery, great prices.
        </p>
        <div className="inline-block bg-white text-primary font-semibold text-sm px-5 py-2.5 rounded-full">
          Up to 50% OFF on first order
        </div>
      </div>
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
      <div className="absolute -bottom-12 -right-4 w-56 h-56 bg-white/5 rounded-full" />
    </div>
  );
}
