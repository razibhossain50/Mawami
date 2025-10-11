"use client"
import type { SVGProps } from "react";
import type { Selection, ChipProps, SortDescriptor } from "@heroui/react";
import React from "react";
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Input, Button, DropdownTrigger,
    Dropdown, DropdownMenu, DropdownItem, Chip, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem
} from "@heroui/react";
import { Plus, EllipsisVertical, Search, ChevronDown, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { logger } from '@/services/logger';
import { handleApiError } from '@/services/error-handler';
import { adminApi } from '@/services/api-client';
import { resolveImageUrl } from '@/services/image-service';
import EditBiodataDrawer from '@/components/admin/EditBiodataDrawer';
import { BiodataProfile, BiodataApprovalStatus, BiodataVisibilityStatus } from '@/types/biodata';

function capitalize(s: string) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

const columns = [
    { name: "ID", uid: "id", sortable: false },
    { name: "USER ID", uid: "userId", sortable: false },
    { name: "APPROVAL STATUS", uid: "biodataApprovalStatus", sortable: true },
    { name: "BIODATA TYPE", uid: "biodataType", sortable: false },
    { name: "MARITAL STATUS", uid: "maritalStatus", sortable: true },
    { name: "FULL NAME", uid: "fullName", sortable: false },
    { name: "PROFILE PICTURE", uid: "profilePicture", sortable: false },
    { name: "OWN MOBILE", uid: "ownMobile", sortable: false },
    { name: "GUARDIAN MOBILE", uid: "guardianMobile", sortable: false },
    { name: "EMAIL/USERNAME", uid: "emailOrUsername", sortable: false },
    { name: "RELIGION", uid: "religion", sortable: false },
    { name: "ACTIONS", uid: "actions", sortable: false },
];

const statusOptions = [
    { name: "Pending", uid: "pending" },
    { name: "Approved", uid: "approved" },
    { name: "Rejected", uid: "rejected" },
    { name: "Inactive", uid: "inactive" },
];

// Using BiodataProfile from types instead of local interface

const statusColorMap: Record<string, ChipProps["color"]> = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
    inactive: "default",
    in_progress: "primary",
};

const biodataTypeColorMap: Record<string, ChipProps["color"]> = {
    "Male": "primary",
    "Female": "danger",
    "Groom": "primary",
    "Bride": "danger",
    "Boy": "primary",
    "Girl": "danger",
    "Man": "primary",
    "Woman": "danger",
};



export default function Biodatas() {
    const { user } = useAuth();
    const [biodatas, setBiodatas] = React.useState<BiodataProfile[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [filterValue, setFilterValue] = React.useState("");
    const [selectedKeys, setSelectedKeys] = React.useState<Selection>(new Set([]));
    const [statusFilter, setStatusFilter] = React.useState<Selection>("all");
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
        column: "biodataApprovalStatus",
        direction: "descending",
    });
    const [page, setPage] = React.useState(1);
    const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
    const [viewModalOpen, setViewModalOpen] = React.useState(false);
    const [editDrawerOpen, setEditDrawerOpen] = React.useState(false);
    const [selectedBiodata, setSelectedBiodata] = React.useState<BiodataProfile | null>(null);
    const [newStatus, setNewStatus] = React.useState<string>("");
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

    // Check if current user is superadmin
    const isSuperAdmin = user?.role === 'superadmin';

    // Handle biodata updated from drawer
    const handleBiodataUpdated = (updatedBiodata: any) => {
        // Convert the drawer's Biodata type to BiodataProfile
        const convertedBiodata: BiodataProfile = {
            ...updatedBiodata,
            email: updatedBiodata.email || '',
            biodataApprovalStatus: updatedBiodata.biodataApprovalStatus as BiodataApprovalStatus,
            biodataVisibilityStatus: updatedBiodata.biodataVisibilityStatus as BiodataVisibilityStatus
        };
        setBiodatas(prev => prev.map(biodata =>
            biodata.id === convertedBiodata.id ? convertedBiodata : biodata
        ));
    };

    // Handle new biodata created from drawer
    const handleBiodataCreated = (newBiodata: any) => {
        // Convert the drawer's Biodata type to BiodataProfile
        const convertedBiodata: BiodataProfile = {
            ...newBiodata,
            email: newBiodata.email || '',
            biodataApprovalStatus: newBiodata.biodataApprovalStatus as BiodataApprovalStatus,
            biodataVisibilityStatus: newBiodata.biodataVisibilityStatus as BiodataVisibilityStatus
        };
        setBiodatas(prev => [convertedBiodata, ...prev]);
    };

    // Handle status update
    const handleStatusUpdate = async () => {
        if (!selectedBiodata || !newStatus || newStatus === (selectedBiodata.biodataApprovalStatus as string)) return;

        try {
            setIsUpdatingStatus(true);
            logger.info('Updating biodata status', {
                biodataId: selectedBiodata.id,
                oldStatus: selectedBiodata.biodataApprovalStatus,
                newStatus
            }, 'AdminBiodatas');

            await adminApi.put(`/biodatas/${selectedBiodata.id}/approval-status`, { status: newStatus });

            // Update local state
            setBiodatas(prev => prev.map(biodata =>
                biodata.id === selectedBiodata.id
                    ? { ...biodata, biodataApprovalStatus: newStatus as BiodataApprovalStatus }
                    : biodata
            ));
            // Update the selected biodata to reflect the change
            setSelectedBiodata(prev => prev ? { ...prev, biodataApprovalStatus: newStatus as BiodataApprovalStatus } : null);
            // Close the modal after successful update
            setViewModalOpen(false);

            logger.info('Biodata status updated successfully', {
                biodataId: selectedBiodata.id,
                newStatus
            }, 'AdminBiodatas');
        } catch (error) {
            const appError = handleApiError(error, 'AdminBiodatas');
            logger.error('Failed to update biodata status', appError, 'AdminBiodatas');
            setError(appError.message);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // Handle delete biodata
    const handleDeleteBiodata = async () => {
        if (!selectedBiodata) return;

        try {
            setIsDeleting(true);
            logger.info('Deleting biodata', { biodataId: selectedBiodata.id }, 'AdminBiodatas');

            await adminApi.delete(`/biodatas/${selectedBiodata.id}`);

            // Remove from local state
            setBiodatas(prev => prev.filter(biodata => biodata.id !== selectedBiodata.id));
            setDeleteModalOpen(false);
            setSelectedBiodata(null);

            logger.info('Biodata deleted successfully', { biodataId: selectedBiodata.id }, 'AdminBiodatas');
        } catch (error) {
            const appError = handleApiError(error, 'AdminBiodatas');
            logger.error('Failed to delete biodata', appError, 'AdminBiodatas');
            setError(appError.message);
        } finally {
            setIsDeleting(false);
        }
    };

    // Fetch all biodatas from admin API
    React.useEffect(() => {
        const fetchBiodatas = async () => {
            try {
                setLoading(true);
                logger.debug('Fetching all biodatas for admin', undefined, 'AdminBiodatas');

                const data = await adminApi.get('/biodatas/admin/all') as BiodataProfile[];
                
                // Debug: Log the received data
                console.log('=== Frontend Admin Biodatas Debug ===');
                console.log('Received biodatas:', data);
                data.forEach((biodata, index) => {
                    console.log(`Biodata ${index + 1}:`, {
                        id: biodata.id,
                        fullName: biodata.fullName,
                        biodataApprovalStatus: biodata.biodataApprovalStatus,
                        biodataVisibilityStatus: biodata.biodataVisibilityStatus
                    });
                });
                
                setBiodatas(data);

                logger.info('Biodatas fetched successfully', { count: data.length }, 'AdminBiodatas');
            } catch (err) {
                const appError = handleApiError(err, 'AdminBiodatas');
                logger.error('Failed to fetch biodatas', appError, 'AdminBiodatas');
                setError(appError.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBiodatas();
    }, []);

    const hasSearchFilter = Boolean(filterValue);

    const headerColumns = React.useMemo(() => {
        return columns;
    }, []);

    const filteredItems = React.useMemo(() => {
        let filteredBiodatas = [...biodatas];

        if (hasSearchFilter) {
            filteredBiodatas = filteredBiodatas.filter((biodata) =>
                biodata.fullName.toLowerCase().includes(filterValue.toLowerCase()),
            );
        }
        if (statusFilter !== "all" && Array.from(statusFilter).length !== statusOptions.length) {
            filteredBiodatas = filteredBiodatas.filter((biodata) =>
                Array.from(statusFilter).includes(biodata.biodataApprovalStatus || 'pending'),
            );
        }

        return filteredBiodatas;
    }, [biodatas, filterValue, hasSearchFilter, statusFilter]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

    const items = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return filteredItems.slice(start, end);
    }, [page, filteredItems, rowsPerPage]);

    const sortedItems = React.useMemo(() => {
        return [...items].sort((a: BiodataProfile, b: BiodataProfile) => {
            // Only allow sorting on biodataApprovalStatus column
            if (sortDescriptor.column !== "biodataApprovalStatus") {
                return 0;
            }

            const first = (a.biodataApprovalStatus || 'pending').toLowerCase();
            const second = (b.biodataApprovalStatus || 'pending').toLowerCase();
            const cmp = first < second ? -1 : first > second ? 1 : 0;

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptor, items]);

    const renderCell = React.useCallback((biodata: BiodataProfile, columnKey: React.Key) => {
        const cellValue = biodata[columnKey as keyof BiodataProfile];

        switch (columnKey) {
            case "fullName":
                return (
                    <div>{biodata.fullName}</div>
                );
            case "biodataType":
                return (
                    <Chip
                        className="capitalize"
                        color={biodataTypeColorMap[biodata.biodataType] || "default"}
                        size="sm"
                        variant="flat"
                    >
                        {cellValue}
                    </Chip>
                );
            case "maritalStatus":
                return (
                    <Chip
                        className="capitalize"
                        color="primary"
                        size="sm"
                        variant="flat"
                    >
                        {cellValue}
                    </Chip>
                );
            case "biodataApprovalStatus":
                // Debug: Log the status value
                console.log(`Rendering status for biodata ${biodata.id}:`, {
                    originalStatus: biodata.biodataApprovalStatus,
                    fallbackStatus: biodata.biodataApprovalStatus || 'pending',
                    type: typeof biodata.biodataApprovalStatus
                });
                
                return (
                    <Chip
                        className="capitalize"
                        color={statusColorMap[biodata.biodataApprovalStatus || 'pending']}
                        size="sm"
                        variant="flat"
                    >
                        {biodata.biodataApprovalStatus || 'pending'}
                    </Chip>
                );
            case "emailOrUsername":
                return (
                    <div className="flex flex-col">
                        <span className="text-small">
                            {biodata.email || "No email"}
                        </span>
                    </div>
                );
            case "profilePicture":
                return (
                    <div className="flex items-center justify-center">
                        {(() => {
                            const { url } = resolveImageUrl(biodata.profilePicture);
                            if (!url) {
                                return null;
                            }
                            return (
                                <img
                                    src={url}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                    onError={(e) => {
                                        // If image fails to load, show placeholder
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                            );
                        })()}
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-200 flex items-center justify-center ${biodata.profilePicture ? 'hidden' : ''}`}>
                            <User className="w-5 h-5 text-purple-400" />
                        </div>
                    </div>
                );
            case "actions":
                return (
                    <div className="relative flex justify-end items-center gap-2">
                        <Dropdown>
                            <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                    <EllipsisVertical className="text-default-300" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu onAction={(key) => {
                                if (key === "view") {
                                    setSelectedBiodata(biodata);
                                    setNewStatus(biodata.biodataApprovalStatus as string || 'pending');
                                    setViewModalOpen(true);
                                } else if (key === "edit") {
                                    setSelectedBiodata(biodata);
                                    setEditDrawerOpen(true);
                                } else if (key === "delete") {
                                    setSelectedBiodata(biodata);
                                    setDeleteModalOpen(true);
                                }
                            }}>
                                <DropdownItem key="view">View</DropdownItem>
                                <DropdownItem key="edit">Edit</DropdownItem>
                                {isSuperAdmin ? (
                                    <DropdownItem key="delete" className="text-danger" color="danger">
                                        Delete
                                    </DropdownItem>
                                ) : null}
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                );
            default:
                return cellValue;
        }
    }, [isSuperAdmin]);

    const onNextPage = React.useCallback(() => {
        if (page < pages) {
            setPage(page + 1);
        }
    }, [page, pages]);

    const onPreviousPage = React.useCallback(() => {
        if (page > 1) {
            setPage(page - 1);
        }
    }, [page]);

    const onRowsPerPageChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(Number(e.target.value));
        setPage(1);
    }, []);

    const onSearchChange = React.useCallback((value?: string) => {
        if (value) {
            setFilterValue(value);
            setPage(1);
        } else {
            setFilterValue("");
        }
    }, []);

    const onClear = React.useCallback(() => {
        setFilterValue("");
        setPage(1);
    }, []);

    const topContent = React.useMemo(() => {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-3 items-end">
                    <Input
                        isClearable
                        className="w-full sm:max-w-[44%]"
                        placeholder="Search by name..."
                        startContent={<Search />}
                        value={filterValue}
                        onClear={() => onClear()}
                        onValueChange={onSearchChange}
                    />
                    <div className="flex gap-3">
                        <Dropdown>
                            <DropdownTrigger className="hidden sm:flex">
                                <Button endContent={<ChevronDown className="text-small" />} variant="flat">
                                    Status
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                disallowEmptySelection
                                aria-label="Table Columns"
                                closeOnSelect={false}
                                selectedKeys={statusFilter}
                                selectionMode="multiple"
                                onSelectionChange={setStatusFilter}
                            >
                                {statusOptions.map((status) => (
                                    <DropdownItem key={status.uid} className="capitalize">
                                        {capitalize(status.name)}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </Dropdown>

                        <Button
                            color="primary"
                            endContent={<Plus />}
                            onPress={() => {
                                setSelectedBiodata(null);
                                setEditDrawerOpen(true);
                            }}
                        >
                            Add New
                        </Button>
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-default-400 text-small">Total {biodatas.length} biodatas</span>
                    <label className="flex items-center text-default-400 text-small">
                        Rows per page:
                        <select
                            className="bg-transparent outline-solid outline-transparent text-default-400 text-small"
                            onChange={onRowsPerPageChange}
                            defaultValue="10"
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="15">15</option>
                        </select>
                    </label>
                </div>
            </div>
        );
    }, [filterValue, onSearchChange, statusFilter, biodatas.length, onRowsPerPageChange, onClear]);

    const bottomContent = React.useMemo(() => {
        return (
            <div className="py-2 px-2 flex justify-between items-center">
                <span className="w-[30%] text-small text-default-400">
                    {selectedKeys === "all"
                        ? "All items selected"
                        : `${selectedKeys.size} of ${filteredItems.length} selected`}
                </span>
                <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={page}
                    total={pages}
                    onChange={setPage}
                />
                <div className="hidden sm:flex w-[30%] justify-end gap-2">
                    <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={onPreviousPage}>
                        Previous
                    </Button>
                    <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={onNextPage}>
                        Next
                    </Button>
                </div>
            </div>
        );
    }, [selectedKeys, filteredItems.length, page, pages, onPreviousPage, onNextPage]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">Loading biodatas...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg text-red-500">Error: {error}</div>
            </div>
        );
    }

    return (
        <>
            <Table
                isHeaderSticky
                aria-label="Admin biodata table with status management"
                bottomContent={bottomContent}
                bottomContentPlacement="outside"
                selectedKeys={selectedKeys}
                selectionMode="multiple"
                sortDescriptor={sortDescriptor}
                topContent={topContent}
                topContentPlacement="outside"
                onSelectionChange={setSelectedKeys}
                onSortChange={setSortDescriptor}
            >
                <TableHeader columns={headerColumns}>
                    {(column) => (
                        <TableColumn
                            key={column.uid}
                            align={column.uid === "actions" ? "center" : "start"}
                            allowsSorting={column.sortable}
                            className={column.uid === "actions" ? "sticky right-0 bg-background z-10" : ""}
                        >
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody emptyContent={"No biodatas found"} items={sortedItems}>
                    {(item) => (
                        <TableRow key={item.id}>
                            {(columnKey) => (
                                <TableCell
                                    className={columnKey === "actions" ? "sticky right-0 bg-background z-10" : ""}
                                >
                                    {renderCell(item, columnKey)}
                                </TableCell>
                            )}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* View & Edit Biodata Modal */}
            <Modal
                isOpen={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                size="5xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    <ModalHeader>
                        <h3 className="text-xl font-bold">Biodata Details & Status Management</h3>
                    </ModalHeader>
                    <ModalBody>
                        {selectedBiodata && (
                            <div className="space-y-6">
                                {/* Header Section with Status Update */}
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h4 className="text-2xl font-bold text-gray-800">{selectedBiodata.fullName}</h4>
                                            <p className="text-gray-600">Biodata ID: #{selectedBiodata.id}</p>
                                        </div>
                                        <div className="text-right">
                                            <Chip
                                                color={statusColorMap[selectedBiodata.biodataApprovalStatus || 'pending']}
                                                size="lg"
                                                variant="flat"
                                                className="mb-2"
                                            >
                                                {selectedBiodata.biodataApprovalStatus || 'pending'}
                                            </Chip>
                                            <p className="text-sm text-gray-600">Step: {selectedBiodata.step}/8</p>
                                        </div>
                                    </div>

                                    {/* Status Update Section */}
                                    <div className="bg-white p-4 rounded-lg border">
                                        <h5 className="font-semibold text-gray-800 mb-3 whitespace-nowrap">Update Status</h5>
                                        <div className="flex items-center gap-4">
                                            <Select
                                                label="Change Status"
                                                placeholder="Select new status"
                                                selectedKeys={newStatus ? [newStatus] : []}
                                                onSelectionChange={(keys) => {
                                                    const selectedKey = Array.from(keys)[0] as string;
                                                    setNewStatus(selectedKey);
                                                }}
                                                className="flex-1"
                                            >
                                                {statusOptions.map((status) => (
                                                    <SelectItem key={status.uid}>
                                                        {status.name}
                                                    </SelectItem>
                                                ))}
                                            </Select>
                                            <Button
                                                color="primary"
                                                onPress={handleStatusUpdate}
                                                isDisabled={!newStatus || newStatus === (selectedBiodata.biodataApprovalStatus as string) || isUpdatingStatus}
                                                isLoading={isUpdatingStatus}
                                            >
                                                {isUpdatingStatus ? "Updating..." : "Update"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="bg-white p-4 rounded-lg border">
                                        <h5 className="font-semibold text-gray-800 mb-3 border-b pb-2">Basic Information</h5>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-sm text-gray-600">Biodata Type:</span>
                                                <p className="font-medium">{selectedBiodata.biodataType}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Religion:</span>
                                                <p className="font-medium">{selectedBiodata.religion}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Marital Status:</span>
                                                <Chip color="primary" size="sm" variant="flat">
                                                    {selectedBiodata.maritalStatus}
                                                </Chip>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Date of Birth:</span>
                                                <p className="font-medium">{selectedBiodata.dateOfBirth}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Age:</span>
                                                <p className="font-medium">{selectedBiodata.age} years</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Physical Information */}
                                    <div className="bg-white p-4 rounded-lg border">
                                        <h5 className="font-semibold text-gray-800 mb-3 border-b pb-2">Physical Information</h5>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-sm text-gray-600">Height:</span>
                                                <p className="font-medium">{selectedBiodata.height}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Weight:</span>
                                                <p className="font-medium">{selectedBiodata.weight} kg</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Complexion:</span>
                                                <p className="font-medium">{selectedBiodata.complexion}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Blood Group:</span>
                                                <p className="font-medium">{selectedBiodata.bloodGroup}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Health Issues:</span>
                                                <p className="font-medium">{selectedBiodata.healthIssues || 'None'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div className="bg-white p-4 rounded-lg border">
                                        <h5 className="font-semibold text-gray-800 mb-3 border-b pb-2">Contact Information</h5>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-sm text-gray-600">Email:</span>
                                                <p className="font-medium">{selectedBiodata.email}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Own Mobile:</span>
                                                <p className="font-medium">{selectedBiodata.ownMobile}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Guardian Mobile:</span>
                                                <p className="font-medium">{selectedBiodata.guardianMobile}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">User ID:</span>
                                                <p className="font-medium">{selectedBiodata.userId || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Education & Profession */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-4 rounded-lg border">
                                        <h5 className="font-semibold text-gray-800 mb-3 border-b pb-2">Education</h5>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-sm text-gray-600">Education Medium:</span>
                                                <p className="font-medium">{selectedBiodata.educationMedium}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Highest Education:</span>
                                                <p className="font-medium">{selectedBiodata.highestEducation}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Institute:</span>
                                                <p className="font-medium">{selectedBiodata.instituteName}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Subject:</span>
                                                <p className="font-medium">{selectedBiodata.subject}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Passing Year:</span>
                                                <p className="font-medium">{selectedBiodata.passingYear}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Result:</span>
                                                <p className="font-medium">{selectedBiodata.result}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border">
                                        <h5 className="font-semibold text-gray-800 mb-3 border-b pb-2">Profession & Economic</h5>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-sm text-gray-600">Profession:</span>
                                                <p className="font-medium">{selectedBiodata.profession}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Economic Condition:</span>
                                                <p className="font-medium">{selectedBiodata.economicCondition}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Address Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-4 rounded-lg border">
                                        <h5 className="font-semibold text-gray-800 mb-3 border-b pb-2">Permanent Address</h5>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-sm text-gray-600">Country:</span>
                                                <p className="font-medium">{selectedBiodata.permanentCountry}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Division:</span>
                                                <p className="font-medium">{selectedBiodata.permanentDivision}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Zilla:</span>
                                                <p className="font-medium">{selectedBiodata.permanentZilla}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Upazilla:</span>
                                                <p className="font-medium">{selectedBiodata.permanentUpazilla}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Area:</span>
                                                <p className="font-medium">{selectedBiodata.permanentArea}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border">
                                        <h5 className="font-semibold text-gray-800 mb-3 border-b pb-2">Present Address</h5>
                                        <div className="space-y-2">
                                            {selectedBiodata.sameAsPermanent ? (
                                                <p className="text-gray-600 italic">Same as permanent address</p>
                                            ) : (
                                                <>
                                                    <div>
                                                        <span className="text-sm text-gray-600">Country:</span>
                                                        <p className="font-medium">{selectedBiodata.presentCountry}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-gray-600">Division:</span>
                                                        <p className="font-medium">{selectedBiodata.presentDivision}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-gray-600">Zilla:</span>
                                                        <p className="font-medium">{selectedBiodata.presentZilla}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-gray-600">Upazilla:</span>
                                                        <p className="font-medium">{selectedBiodata.presentUpazilla}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-gray-600">Area:</span>
                                                        <p className="font-medium">{selectedBiodata.presentArea}</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Family Information */}
                                <div className="bg-white p-4 rounded-lg border">
                                    <h5 className="font-semibold text-gray-800 mb-3 border-b pb-2">Family Information</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <span className="text-sm text-gray-600">Father's Name:</span>
                                            <p className="font-medium">{selectedBiodata.fatherName}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Father's Profession:</span>
                                            <p className="font-medium">{selectedBiodata.fatherProfession}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Father Status:</span>
                                            <p className="font-medium">{selectedBiodata.fatherAlive}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Mother's Name:</span>
                                            <p className="font-medium">{selectedBiodata.motherName}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Mother's Profession:</span>
                                            <p className="font-medium">{selectedBiodata.motherProfession}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Mother Status:</span>
                                            <p className="font-medium">{selectedBiodata.motherAlive}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Brothers:</span>
                                            <p className="font-medium">{selectedBiodata.brothersCount}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Sisters:</span>
                                            <p className="font-medium">{selectedBiodata.sistersCount}</p>
                                        </div>
                                    </div>
                                    {selectedBiodata.familyDetails && (
                                        <div className="mt-4">
                                            <span className="text-sm text-gray-600">Family Details:</span>
                                            <p className="font-medium mt-1 p-3 bg-gray-50 rounded">{selectedBiodata.familyDetails}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Partner Preferences */}
                                <div className="bg-white p-4 rounded-lg border">
                                    <h5 className="font-semibold text-gray-800 mb-3 border-b pb-2">Partner Preferences</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <span className="text-sm text-gray-600">Age Range:</span>
                                            <p className="font-medium">{selectedBiodata.partnerAgeMin} - {selectedBiodata.partnerAgeMax} years</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Complexion:</span>
                                            <p className="font-medium">{selectedBiodata.partnerComplexion}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Height:</span>
                                            <p className="font-medium">{selectedBiodata.partnerHeight}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Education:</span>
                                            <p className="font-medium">{selectedBiodata.partnerEducation}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Profession:</span>
                                            <p className="font-medium">{selectedBiodata.partnerProfession}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Location:</span>
                                            <p className="font-medium">{selectedBiodata.partnerLocation}</p>
                                        </div>
                                    </div>
                                    {selectedBiodata.partnerDetails && (
                                        <div className="mt-4">
                                            <span className="text-sm text-gray-600">Additional Partner Details:</span>
                                            <p className="font-medium mt-1 p-3 bg-gray-50 rounded">{selectedBiodata.partnerDetails}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Profile Picture */}
                                {(() => {
                                    const { url } = resolveImageUrl(selectedBiodata.profilePicture);
                                    if (!url) return null;
                                    return (
                                        <div className="bg-white p-4 rounded-lg border">
                                            <h5 className="font-semibold text-gray-800 mb-3 border-b pb-2">Profile Picture</h5>
                                            <div className="flex justify-center">
                                                <img
                                                    src={url}
                                                    alt="Profile"
                                                    className="max-w-xs max-h-64 object-cover rounded-lg shadow-md"
                                                />
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Progress Information */}
                                <div className="bg-white p-4 rounded-lg border">
                                    <h5 className="font-semibold text-gray-800 mb-3 border-b pb-2">Progress Information</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <span className="text-sm text-gray-600">Current Step:</span>
                                            <p className="font-medium">{selectedBiodata.step} of 8</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Completed Steps:</span>
                                            <p className="font-medium">{selectedBiodata.completedSteps?.length || 0}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Progress:</span>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                                <div
                                                    className="bg-blue-600 h-2.5 rounded-full"
                                                    style={{ width: `${((selectedBiodata.completedSteps?.length || 0) / 8) * 100}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {Math.round(((selectedBiodata.completedSteps?.length || 0) / 8) * 100)}% Complete
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="light"
                            onPress={() => setViewModalOpen(false)}
                        >
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
                <ModalContent>
                    <ModalHeader>
                        <h3 className="text-danger">Delete Biodata</h3>
                    </ModalHeader>
                    <ModalBody>
                        {selectedBiodata && (
                            <div className="space-y-4">
                                <div className="text-center">
                                    <p className="text-lg font-semibold text-danger mb-2">
                                        Are you sure you want to delete this biodata?
                                    </p>
                                    <p className="text-sm text-gray-600 mb-4">
                                        This action cannot be undone.
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Biodata ID:</p>
                                            <p className="font-semibold">{selectedBiodata.id}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Name:</p>
                                            <p className="font-semibold">{selectedBiodata.fullName}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Email:</p>
                                            <p className="font-semibold">{selectedBiodata.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Status:</p>
                                            <Chip
                                                color={statusColorMap[selectedBiodata.biodataApprovalStatus || 'inactive']}
                                                size="sm"
                                                variant="flat"
                                            >
                                                {selectedBiodata.biodataApprovalStatus || 'inactive'}
                                            </Chip>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="light"
                            onPress={() => setDeleteModalOpen(false)}
                            isDisabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="danger"
                            onPress={handleDeleteBiodata}
                            isLoading={isDeleting}
                            isDisabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete Biodata"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            {/* View Biodata Modal */}
            <Modal
                isOpen={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                size="5xl"
                scrollBehavior="inside"
                classNames={{
                    base: "bg-background",
                    backdrop: "bg-black/50 backdrop-blur-sm",
                    header: "border-b border-divider",
                    body: "py-6",
                    footer: "border-t border-divider"
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <h2 className="text-2xl font-bold text-foreground">Biodata Details</h2>
                        <p className="text-sm text-default-500">View and manage biodata information</p>
                    </ModalHeader>
                    <ModalBody>
                        {selectedBiodata && (
                            <div className="space-y-8">
                                {/* Header Section */}
                                <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 p-6 rounded-large border border-divider">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-3xl font-bold text-foreground mb-2">{selectedBiodata.fullName}</h3>
                                            <div className="flex items-center gap-4 text-default-600">
                                                <span className="flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                                                    Biodata ID: #{selectedBiodata.id}
                                                </span>
                                                <span className="flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-secondary rounded-full"></span>
                                                    Step: {selectedBiodata.step}/8
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-3">
                                            <Chip
                                                color={statusColorMap[selectedBiodata.biodataApprovalStatus || 'inactive']}
                                                size="lg"
                                                variant="shadow"
                                                className="font-semibold"
                                            >
                                                {selectedBiodata.biodataApprovalStatus || 'inactive'}
                                            </Chip>
                                            <div className="bg-content2 px-3 py-1 rounded-full">
                                                <span className="text-xs font-medium text-default-700">
                                                    {Math.round(((selectedBiodata.completedSteps?.length || 0) / 8) * 100)}% Complete
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="bg-white p-4 rounded-lg border">
                                        <h5 className="font-semibold text-gray-800 mb-3 border-b pb-2">Basic Information</h5>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-sm text-gray-600">Biodata Type:</span>
                                                <p className="font-medium">{selectedBiodata.biodataType}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Religion:</span>
                                                <p className="font-medium">{selectedBiodata.religion}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Marital Status:</span>
                                                <Chip color="primary" size="sm" variant="flat">
                                                    {selectedBiodata.maritalStatus}
                                                </Chip>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Date of Birth:</span>
                                                <p className="font-medium">{selectedBiodata.dateOfBirth}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Age:</span>
                                                <p className="font-medium">{selectedBiodata.age} years</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Physical Information */}
                                    <div className="bg-white p-4 rounded-lg border">
                                        <h5 className="font-semibold text-gray-800 mb-3 border-b pb-2">Physical Information</h5>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-sm text-gray-600">Height:</span>
                                                <p className="font-medium">{selectedBiodata.height}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Weight:</span>
                                                <p className="font-medium">{selectedBiodata.weight} kg</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Complexion:</span>
                                                <p className="font-medium">{selectedBiodata.complexion}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Blood Group:</span>
                                                <p className="font-medium">{selectedBiodata.bloodGroup}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Health Issues:</span>
                                                <p className="font-medium">{selectedBiodata.healthIssues || 'None'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div className="bg-white p-4 rounded-lg border">
                                        <h5 className="font-semibold text-gray-800 mb-3 border-b pb-2">Contact Information</h5>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-sm text-gray-600">Email:</span>
                                                <p className="font-medium">{selectedBiodata.email}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Own Mobile:</span>
                                                <p className="font-medium">{selectedBiodata.ownMobile}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Guardian Mobile:</span>
                                                <p className="font-medium">{selectedBiodata.guardianMobile}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">User ID:</span>
                                                <p className="font-medium">{selectedBiodata.userId || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Education & Profession */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-4 rounded-lg border">
                                        <h5 className="font-semibold text-gray-800 mb-3 border-b pb-2">Education</h5>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-sm text-gray-600">Education Medium:</span>
                                                <p className="font-medium">{selectedBiodata.educationMedium}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Highest Education:</span>
                                                <p className="font-medium">{selectedBiodata.highestEducation}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Institute:</span>
                                                <p className="font-medium">{selectedBiodata.instituteName}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Subject:</span>
                                                <p className="font-medium">{selectedBiodata.subject}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Passing Year:</span>
                                                <p className="font-medium">{selectedBiodata.passingYear}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Result:</span>
                                                <p className="font-medium">{selectedBiodata.result}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border">
                                        <h5 className="font-semibold text-gray-800 mb-3 border-b pb-2">Profession & Economic</h5>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-sm text-gray-600">Profession:</span>
                                                <p className="font-medium">{selectedBiodata.profession}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Economic Condition:</span>
                                                <p className="font-medium">{selectedBiodata.economicCondition}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Address Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-4 rounded-lg border">
                                        <h5 className="font-semibold text-gray-800 mb-3 border-b pb-2">Permanent Address</h5>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-sm text-gray-600">Country:</span>
                                                <p className="font-medium">{selectedBiodata.permanentCountry}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Division:</span>
                                                <p className="font-medium">{selectedBiodata.permanentDivision}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Zilla:</span>
                                                <p className="font-medium">{selectedBiodata.permanentZilla}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Upazilla:</span>
                                                <p className="font-medium">{selectedBiodata.permanentUpazilla}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Area:</span>
                                                <p className="font-medium">{selectedBiodata.permanentArea}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border">
                                        <h5 className="font-semibold text-gray-800 mb-3 border-b pb-2">Present Address</h5>
                                        <div className="space-y-2">
                                            {selectedBiodata.sameAsPermanent ? (
                                                <p className="text-gray-600 italic">Same as permanent address</p>
                                            ) : (
                                                <>
                                                    <div>
                                                        <span className="text-sm text-gray-600">Country:</span>
                                                        <p className="font-medium">{selectedBiodata.presentCountry}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-gray-600">Division:</span>
                                                        <p className="font-medium">{selectedBiodata.presentDivision}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-gray-600">Zilla:</span>
                                                        <p className="font-medium">{selectedBiodata.presentZilla}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-gray-600">Upazilla:</span>
                                                        <p className="font-medium">{selectedBiodata.presentUpazilla}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-gray-600">Area:</span>
                                                        <p className="font-medium">{selectedBiodata.presentArea}</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Family Information */}
                                <div className="bg-white p-4 rounded-lg border">
                                    <h5 className="font-semibold text-gray-800 mb-3 border-b pb-2">Family Information</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <span className="text-sm text-gray-600">Father&apos;s Name:</span>
                                            <p className="font-medium">{selectedBiodata.fatherName}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Father&apos;s Profession:</span>
                                            <p className="font-medium">{selectedBiodata.fatherProfession}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Father Status:</span>
                                            <p className="font-medium">{selectedBiodata.fatherAlive}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Mother&apos;s Name:</span>
                                            <p className="font-medium">{selectedBiodata.motherName}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Mother&apos;s Profession:</span>
                                            <p className="font-medium">{selectedBiodata.motherProfession}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Mother Status:</span>
                                            <p className="font-medium">{selectedBiodata.motherAlive}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Brothers:</span>
                                            <p className="font-medium">{selectedBiodata.brothersCount}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Sisters:</span>
                                            <p className="font-medium">{selectedBiodata.sistersCount}</p>
                                        </div>
                                    </div>
                                    {selectedBiodata.familyDetails && (
                                        <div className="mt-4">
                                            <span className="text-sm text-gray-600">Family Details:</span>
                                            <p className="font-medium mt-1 p-3 bg-gray-50 rounded">{selectedBiodata.familyDetails}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Partner Preferences */}
                                <div className="bg-white p-4 rounded-lg border">
                                    <h5 className="font-semibold text-gray-800 mb-3 border-b pb-2">Partner Preferences</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <span className="text-sm text-gray-600">Age Range:</span>
                                            <p className="font-medium">{selectedBiodata.partnerAgeMin} - {selectedBiodata.partnerAgeMax} years</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Complexion:</span>
                                            <p className="font-medium">{selectedBiodata.partnerComplexion}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Height:</span>
                                            <p className="font-medium">{selectedBiodata.partnerHeight}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Education:</span>
                                            <p className="font-medium">{selectedBiodata.partnerEducation}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Profession:</span>
                                            <p className="font-medium">{selectedBiodata.partnerProfession}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Location:</span>
                                            <p className="font-medium">{selectedBiodata.partnerLocation}</p>
                                        </div>
                                    </div>
                                    {selectedBiodata.partnerDetails && (
                                        <div className="mt-4">
                                            <span className="text-sm text-gray-600">Additional Partner Details:</span>
                                            <p className="font-medium mt-1 p-3 bg-gray-50 rounded">{selectedBiodata.partnerDetails}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Profile Picture */}
                                {(() => {
                                    const { url } = resolveImageUrl(selectedBiodata.profilePicture);
                                    if (!url) return null;
                                    return (
                                        <div className="bg-white p-4 rounded-lg border">
                                            <h5 className="font-semibold text-gray-800 mb-3 border-b pb-2">Profile Picture</h5>
                                            <div className="flex justify-center">
                                                <img
                                                    src={url}
                                                    alt="Profile"
                                                    className="max-w-xs max-h-64 object-cover rounded-lg shadow-md"
                                                />
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter className="flex justify-end items-end py-2 bg-content1/50">
                    <div>
                        <div className="text-sm font-semibold text-default-700 whitespace-nowrap mb-1">Biodata Status:</div>
                            <Select
                                size="md"
                                placeholder="Select new status"
                                selectedKeys={newStatus ? [newStatus] : []}
                                onSelectionChange={(keys) => {
                                    const selectedKey = Array.from(keys)[0] as string;
                                    setNewStatus(selectedKey);
                                }}
                                className="min-w-[160px]"
                                variant="bordered"
                                classNames={{
                                    trigger: "bg-background border-divider hover:border-primary transition-colors",
                                    value: "text-foreground font-medium",
                                    popoverContent: "bg-content1 border-divider"
                                }}
                            >
                                {statusOptions.map((status) => (
                                    <SelectItem
                                        key={status.uid}
                                        className="text-foreground hover:bg-primary/10"
                                        startContent={
                                            <Chip
                                                size="sm"
                                                variant="dot"
                                                color={statusColorMap[status.uid] || 'default'}
                                            />
                                        }
                                    >
                                        {status.name}
                                    </SelectItem>
                                ))}
                            </Select>
                    </div>
                            <Button
                                color="primary"
                                size="md"
                                onPress={handleStatusUpdate}
                                isDisabled={!newStatus || newStatus === (selectedBiodata?.biodataApprovalStatus as string) || isUpdatingStatus}
                                isLoading={isUpdatingStatus}
                                variant="shadow"
                                className="font-semibold px-6 min-w-[120px]"
                                startContent={!isUpdatingStatus ? <span>✓</span> : undefined}
                            >
                                {isUpdatingStatus ? "Updating..." : "Update Status"}
                            </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal >

            {/* Edit Biodata Drawer */}
            <EditBiodataDrawer
                isOpen={editDrawerOpen}
                onClose={() => setEditDrawerOpen(false)}
                selectedBiodata={selectedBiodata}
                onBiodataUpdated={handleBiodataUpdated}
                onBiodataCreated={handleBiodataCreated}
            />
        </>
    );
}
