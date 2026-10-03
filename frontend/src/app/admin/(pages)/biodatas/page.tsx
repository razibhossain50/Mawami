"use client"
import { FormInput, FormSelect } from "@/components/ui/form-fields";
import type { SVGProps } from "react";
import type { Selection, ChipProps, SortDescriptor } from "@heroui/react";
import React from "react";
import { Table, Button, Dropdown, Chip, Label, Modal } from "@heroui/react";
import { PageNav } from "@/components/ui/page-nav";
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
    in_progress: "accent",
};

const biodataTypeColorMap: Record<string, ChipProps["color"]> = {
    "Male": "accent",
    "Female": "danger",
    "Groom": "accent",
    "Bride": "danger",
    "Boy": "accent",
    "Girl": "danger",
    "Man": "accent",
    "Woman": "danger",
};



export default function Biodatas() {
    const { user } = useAuth();
    const [biodatas, setBiodatas] = React.useState<BiodataProfile[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [filterValue, setFilterValue] = React.useState("");
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

    const sortedItems = React.useMemo(() => {
        return [...filteredItems].sort((a: BiodataProfile, b: BiodataProfile) => {
            // Only allow sorting on biodataApprovalStatus column
            if (sortDescriptor.column !== "biodataApprovalStatus") {
                return 0;
            }

            const first = (a.biodataApprovalStatus || 'pending').toLowerCase();
            const second = (b.biodataApprovalStatus || 'pending').toLowerCase();
            const cmp = first < second ? -1 : first > second ? 1 : 0;

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptor, filteredItems]);

    // Current page of the sorted results
    const pageItems = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return sortedItems.slice(start, start + rowsPerPage);
    }, [page, sortedItems, rowsPerPage]);

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
                        variant="soft"
                    >
                        {cellValue}
                    </Chip>
                );
            case "maritalStatus":
                return (
                    <Chip
                        className="capitalize"
                        color="accent"
                        size="sm"
                        variant="soft"
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
                        variant="soft"
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
                            <Button variant="ghost" isIconOnly size="sm" aria-label={`Actions for biodata ${biodata.id}`}>
                                <EllipsisVertical className="text-muted" />
                            </Button>
                            <Dropdown.Popover>
                            <Dropdown.Menu onAction={(key) => {
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
                                <Dropdown.Item id="view" textValue="View"><Label>View</Label></Dropdown.Item>
                                <Dropdown.Item id="edit" textValue="Edit"><Label>Edit</Label></Dropdown.Item>
                                {isSuperAdmin ? (
                                    <Dropdown.Item id="delete" textValue="Delete" variant="danger">
                                        <Label>Delete</Label>
                                    </Dropdown.Item>
                                ) : null}
                            </Dropdown.Menu>
                            </Dropdown.Popover>
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
                    <FormInput
                        className="w-full sm:max-w-[44%]"
                        placeholder="Search by name..."
                        startContent={<Search />}
                        value={filterValue}
                        onValueChange={onSearchChange}
                        onClear={onClear}
                    />
                    <div className="flex gap-3">
                        <Dropdown>
                            <Button variant="secondary" className="hidden sm:flex">
                                Status
                                <ChevronDown className="text-small" />
                            </Button>
                            <Dropdown.Popover>
                                <Dropdown.Menu
                                    disallowEmptySelection
                                    aria-label="Status filter"
                                    shouldCloseOnSelect={false}
                                    selectedKeys={statusFilter}
                                    selectionMode="multiple"
                                    onSelectionChange={setStatusFilter}
                                >
                                    {statusOptions.map((status) => (
                                        <Dropdown.Item key={status.uid} id={status.uid} textValue={status.name} className="capitalize">
                                            <Dropdown.ItemIndicator />
                                            <Label>{capitalize(status.name)}</Label>
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            </Dropdown.Popover>
                        </Dropdown>

                        <Button
                            variant="primary"
                            onPress={() => {
                                setSelectedBiodata(null);
                                setEditDrawerOpen(true);
                            }}
                        >
                            Add New
                        {<Plus />}</Button>
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted text-small">Total {biodatas.length} biodatas</span>
                    <label className="flex items-center text-muted text-small">
                        Rows per page:
                        <select
                            className="bg-transparent outline-solid outline-transparent text-muted text-small"
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
                <span className="w-[30%] text-small text-muted">
                    {filteredItems.length} {filteredItems.length === 1 ? "biodata" : "biodatas"}
                </span>
                <PageNav page={page} total={pages} onChange={setPage} size="sm" />
                <div className="hidden sm:flex w-[30%] justify-end gap-2">
                    <Button variant="secondary" isDisabled={pages === 1} size="sm" onPress={onPreviousPage}>
                        Previous
                    </Button>
                    <Button variant="secondary" isDisabled={pages === 1} size="sm" onPress={onNextPage}>
                        Next
                    </Button>
                </div>
            </div>
        );
    }, [filteredItems.length, page, pages, onPreviousPage, onNextPage]);

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
            <div className="flex flex-col gap-4">
                {topContent}
                <Table>
                    <Table.ScrollContainer>
                        <Table.Content
                            aria-label="Admin biodata table with status management"
                            sortDescriptor={sortDescriptor}
                            onSortChange={setSortDescriptor}
                        >
                            <Table.Header columns={headerColumns}>
                                {(column) => (
                                    <Table.Column
                                        id={column.uid}
                                        isRowHeader={column.uid === "fullName"}
                                        allowsSorting={column.sortable}
                                        className={column.uid === "actions" ? "sticky right-0 bg-background z-10 text-center" : undefined}
                                    >
                                        {({ sortDirection }) => column.sortable ? (
                                            <Table.SortableColumnHeader sortDirection={sortDirection}>{column.name}</Table.SortableColumnHeader>
                                        ) : column.name}
                                    </Table.Column>
                                )}
                            </Table.Header>
                            <Table.Body items={pageItems} renderEmptyState={() => "No biodatas found"}>
                                {(item) => (
                                    <Table.Row id={item.id}>
                                        <Table.Collection items={headerColumns}>
                                            {(column) => (
                                                <Table.Cell className={column.uid === "actions" ? "sticky right-0 bg-background z-10" : undefined}>
                                                    {renderCell(item, column.uid)}
                                                </Table.Cell>
                                            )}
                                        </Table.Collection>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table.Content>
                    </Table.ScrollContainer>
                </Table>
                {bottomContent}
            </div>


            {/* Delete Confirmation Modal */}
            <Modal.Backdrop isOpen={deleteModalOpen} onOpenChange={(open) => { if (!open) setDeleteModalOpen(false); }}>
              <Modal.Container size="md">
                <Modal.Dialog>
                    <Modal.Header>
                        <h3 className="text-danger">Delete Biodata</h3>
                    </Modal.Header>
                    <Modal.Body>
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
                                                variant="soft"
                                            >
                                                {selectedBiodata.biodataApprovalStatus || 'inactive'}
                                            </Chip>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="ghost"
                            onPress={() => setDeleteModalOpen(false)}
                            isDisabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onPress={handleDeleteBiodata}
                            isPending={isDeleting}
                            isDisabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete Biodata"}
                        </Button>
                    </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
            {/* View Biodata Modal */}
            <Modal.Backdrop isOpen={viewModalOpen} onOpenChange={(open) => { if (!open) setViewModalOpen(false); }}>
              <Modal.Container size="lg" scroll="inside">
                <Modal.Dialog className="sm:max-w-5xl">
                    <Modal.Header className="flex flex-col gap-1">
                        <h2 className="text-2xl font-bold text-foreground">Biodata Details</h2>
                        <p className="text-sm text-muted">View and manage biodata information</p>
                    </Modal.Header>
                    <Modal.Body>
                        {selectedBiodata && (
                            <div className="space-y-8">
                                {/* Header Section */}
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-large border border-separator">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-3xl font-bold text-foreground mb-2">{selectedBiodata.fullName}</h3>
                                            <div className="flex items-center gap-4 text-foreground">
                                                <span className="flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-accent rounded-full"></span>
                                                    Biodata ID: #{selectedBiodata.id}
                                                </span>
                                                <span className="flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-accent-soft rounded-full"></span>
                                                    Step: {selectedBiodata.step}/8
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-3">
                                            <Chip
                                                color={statusColorMap[selectedBiodata.biodataApprovalStatus || 'inactive']}
                                                size="lg"
                                                variant="primary"
                                                className="font-semibold"
                                            >
                                                {selectedBiodata.biodataApprovalStatus || 'inactive'}
                                            </Chip>
                                            <div className="bg-surface-secondary px-3 py-1 rounded-full">
                                                <span className="text-xs font-medium text-foreground">
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
                                                <Chip color="accent" size="sm" variant="soft">
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
                    </Modal.Body>
                    <Modal.Footer className="flex justify-end items-end py-2 bg-surface/50">
                    <div>
                        <div className="text-sm font-semibold text-foreground whitespace-nowrap mb-1">Biodata Status:</div>
                            <FormSelect variant="bordered"
                              placeholder="Select new status"
                              value={newStatus ? newStatus : null}
                              onValueChange={(selected) => {
                                    const selectedKey = selected ?? "";
                                    setNewStatus(selectedKey);
                                }}
                              className="min-w-[160px]"
                              options={statusOptions.map((status) => ({ value: String(status.uid), label: status.name }))}
                            />
                    </div>
                            <Button
                                variant="primary"
                                size="md"
                                onPress={handleStatusUpdate}
                                isDisabled={!newStatus || newStatus === (selectedBiodata?.biodataApprovalStatus as string) || isUpdatingStatus}
                                isPending={isUpdatingStatus}
                                className="font-semibold px-6 min-w-[120px]"
                            >{!isUpdatingStatus ? <span>✓</span> : undefined}
                                {isUpdatingStatus ? "Updating..." : "Update Status"}
                            </Button>
                    </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>

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
