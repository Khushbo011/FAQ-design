import React from "react";
import { Collapsible, Button, Card, Grid, Badge, Icon, ButtonGroup, Text } from "@shopify/polaris";
import { DragHandleIcon, EditIcon, DeleteIcon } from "@shopify/polaris-icons";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableItem({ id, faq, categoryName, onEdit, onDelete, viewMode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const [open, setOpen] = React.useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: "10px",
    background: "white",
    border: "1px solid #e1e3e5",
    borderRadius: "8px",
    padding: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  };

  if (viewMode === "grid") {
    return (
      <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 4, xl: 4}}>
        <Card sectioned>
          <Text variant="headingMd" as="h3">{faq.question}</Text>
          <div style={{ marginTop: '10px', marginBottom: '10px', color: 'gray' }} dangerouslySetInnerHTML={{ __html: faq.answer.substring(0, 50) + '...' }} />
          <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
             {categoryName && <Badge>{categoryName}</Badge>}
             <Badge tone={faq.isActive ? "success" : "critical"}>{faq.isActive ? "Active" : "Inactive"}</Badge>
          </div>
          <ButtonGroup>
            <Button icon={EditIcon} onClick={() => onEdit(faq)} />
            <Button icon={DeleteIcon} tone="critical" onClick={() => onDelete(faq.id)} />
          </ButtonGroup>
        </Card>
      </Grid.Cell>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
        <div {...listeners} style={{ cursor: "grab" }}>
          <Icon source={DragHandleIcon} />
        </div>
        <div style={{ flex: 1 }}>
          <div onClick={() => setOpen(!open)} style={{ cursor: "pointer", display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Text variant="bodyMd" fontWeight="bold">{faq.question}</Text>
            {categoryName && <Badge>{categoryName}</Badge>}
            <Badge tone={faq.isActive ? "success" : "critical"}>{faq.isActive ? "Active" : "Inactive"}</Badge>
          </div>
          <Collapsible open={open} id={`faq-${id}`}>
            <div style={{ padding: "10px 0" }} dangerouslySetInnerHTML={{ __html: faq.answer }} />
          </Collapsible>
        </div>
        <ButtonGroup>
          <Button icon={EditIcon} onClick={() => onEdit(faq)} />
          <Button icon={DeleteIcon} tone="critical" onClick={() => onDelete(faq.id)} />
        </ButtonGroup>
      </div>
    </div>
  );
}

export function FAQList({ faqs, categories, onReorder, onEdit, onDelete, viewMode }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = faqs.findIndex((faq) => faq.id === active.id);
      const newIndex = faqs.findIndex((faq) => faq.id === over.id);
      onReorder(arrayMove(faqs, oldIndex, newIndex));
    }
  };

  const getCategoryName = (categoryId) => {
    return categories.find((c) => c.id === categoryId)?.name;
  };

  if (viewMode === "grid") {
    return (
      <Grid>
        {faqs.map((faq) => (
          <SortableItem key={faq.id} id={faq.id} faq={faq} categoryName={getCategoryName(faq.categoryId)} onEdit={onEdit} onDelete={onDelete} viewMode="grid" />
        ))}
      </Grid>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={faqs.map(f => f.id)} strategy={verticalListSortingStrategy}>
        <div style={{ marginTop: "20px" }}>
          {faqs.map((faq) => (
            <SortableItem key={faq.id} id={faq.id} faq={faq} categoryName={getCategoryName(faq.categoryId)} onEdit={onEdit} onDelete={onDelete} viewMode={viewMode} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
