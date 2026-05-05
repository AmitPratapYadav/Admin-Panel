const PermissionNotice = ({ title = "Access restricted", message = "You do not have permission to view this section." }) => {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-amber-800">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm">{message}</p>
    </div>
  );
};

export default PermissionNotice;
