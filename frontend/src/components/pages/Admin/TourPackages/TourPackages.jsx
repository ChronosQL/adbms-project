import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import AdminPackageDeleteModal from "./AdminPackageDeleteModal";
import AdminPackageFilters from "./AdminPackageFilters";
import AdminPackageFormModal from "./AdminPackageFormModal";
import AdminPackageHero from "./AdminPackageHero";
import AdminPackageTable from "./AdminPackageTable";
import { adminFilter, packageStore } from './adminPackagesData';
import Toast from "./Toast";
import Pagination from "../../../common/Pagination";

function TourPackages() {
	const dark = useOutletContext()?.dark ?? false;
	const [packages, setPackages] = useState([]);
	const [search, setSearch] = useState('');
	const [activeType, setActiveType] = useState('All');
	const [activeDays, setActiveDays] = useState('All');
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingPackage, setEditingPackage] = useState(null);
	const [deletingPackage, setDeletingPackage] = useState(null);
	const [toast, setToast] = useState({ message: "", visible: false });
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(8);

	const showToast = (message) => {
		setToast({ message, visible: true });
		setTimeout(() => setToast({ message: "", visible: false }), 3000);
	};

	useEffect(() => {
		const unsubscribe = packageStore.subscribe((next) => setPackages(next));
		return unsubscribe;
	}, []);

	useEffect(() => {
		setPage(1);
	}, [search, activeType, activeDays]);

	const filteredPackages = useMemo(() => {
		return adminFilter(packages, {
			search,
			type: activeType,
			days: activeDays,
		});
	}, [packages, search, activeType, activeDays]);

	const totalPages = Math.ceil(filteredPackages.length / limit) || 1;
	const currentPage = Math.min(page, totalPages);
	const paginatedPackages = filteredPackages.slice((currentPage - 1) * limit, currentPage * limit);

	const handleAddNew = () => {
		setEditingPackage(null);
		setIsFormOpen(true);
	};

	const handleEdit = async (pkg) => {
		try {
			// The grid list only has a summary (max 2 destinations, no activities).
			// Fetch the full details from the backend before editing.
			const fullPkg = await packageStore.get(pkg.id);
			setEditingPackage(fullPkg);
			setIsFormOpen(true);
		} catch (err) {
			alert('Failed to load full package details. Please try again.');
			console.error(err);
		}
	};

	const handleSave = async (data) => {
		try {
			if (editingPackage?.id) {
				await packageStore.update(editingPackage.id, data);
				showToast("Package updated successfully!");
			} else {
				await packageStore.create(data);
				showToast("Package created successfully!");
			}
			setIsFormOpen(false);
			setEditingPackage(null);
		} catch (error) {
			console.error('Failed to save package:', error);
			alert(error?.message || 'Failed to save package. Please check the backend and Cloudinary settings.');
		}
	};

	const handleDeleteConfirm = (id) => {
		(async () => {
			try {
				await packageStore.delete(id);
				showToast("Package deleted successfully!");
			} catch (err) {
				console.error('Failed to delete package', err);
				alert(err?.message || 'Failed to delete package');
			}
		})();
		setDeletingPackage(null);
	};

	const handleResetFilters = () => {
		setSearch('');
		setActiveType('All');
		setActiveDays('All');
	};

	return (
		<div className={dark ? 'min-h-screen bg-[#020617]' : 'min-h-screen bg-[#f8fafc]'}>
		<AdminPackageHero
			dark={dark}
			total={packages.length}
			onAddNew={handleAddNew}
		/>
		<AdminPackageFilters
			dark={dark}
			search={search}
			onSearch={setSearch}
			activeType={activeType}
			onTypeChange={setActiveType}
			activeDays={activeDays}
			onDaysChange={setActiveDays}
			total={packages.length}
			filtered={filteredPackages.length}
			onReset={handleResetFilters}
		/>
		<AdminPackageTable
			dark={dark}
			packages={paginatedPackages}
			onEdit={handleEdit}
			onDelete={setDeletingPackage}
		/>
		{filteredPackages.length > limit && (
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				<Pagination
					pagination={{
						page: currentPage,
						totalPages,
						total: filteredPackages.length,
						limit,
					}}
					onPageChange={setPage}
					onLimitChange={(newLimit) => {
						setLimit(newLimit);
						setPage(1);
					}}
					limitOptions={[8, 16, 24]}
					itemLabel="packages"
					scrollToRef={false}
				/>
			</div>
		)}
		<AdminPackageFormModal
			dark={dark}
			isOpen={isFormOpen}
			pkg={editingPackage}
			onSave={handleSave}
			existingPackages={packages}
			editingId={editingPackage?.id}
			onClose={() => {
				setIsFormOpen(false);
				setEditingPackage(null);
			}}
		/>
		<AdminPackageDeleteModal
			dark={dark}
			pkg={deletingPackage}
			onConfirm={handleDeleteConfirm}
			onCancel={() => setDeletingPackage(null)}
		/>
		<Toast message={toast.message} visible={toast.visible} />
		</div>
	);
}

export default TourPackages;
